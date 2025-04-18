import mongoose from "mongoose";
import { AlertService } from "./alerting";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const options: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  autoIndex: true,
  maxConnecting: 2,
};

class Database {
  private static instance: Database;
  private isConnecting: boolean = false;
  private monitorInterval?: NodeJS.Timeout;

  private constructor() {
    this.setupConnectionHandlers();
    this.monitorConnectionPool();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      console.log("Creating new Database instance");
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async tryReconnect(retryAttempts = 3, delay = 1000) {
    for (let i = 0; i < retryAttempts; i++) {
      try {
        await this.connect();
        return;
      } catch (error) {
        console.error(`Reconnection attempt ${i + 1} failed:`, error);
        if (i < retryAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.error("All reconnection attempts failed");
  }

  private async cleanupOldListeners() {
    const events = ["connected", "disconnected", "error"];
    events.forEach((event) => {
      const listeners = mongoose.connection.listeners(event);
      listeners.forEach((listener) => {
        mongoose.connection.removeListener(
          event,
          listener as (...args: unknown[]) => void
        );
      });
    });
  }

  private setupConnectionHandlers() {
    mongoose.connection.setMaxListeners(15);
    const alertService = AlertService.getInstance();

    // Force immediate console output
    const log = (...args: any[]) => {
      console.log(...args);
      // Force flush stdout
      if (process.stdout.write && typeof process.stdout.write === "function") {
        process.stdout.write("");
      }
    };

    mongoose.connection.on("connected", () => {
      this.isConnecting = false;
      void alertService.alert("CONNECTION", "MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      void alertService.alert(
        "ERROR",
        `MongoDB connection error: ${err.message}`
      );
      if (!this.isConnecting) {
        void this.tryReconnect();
      }
    });

    mongoose.connection.on("disconnected", () => {
      void alertService.alert(
        "DISCONNECTION",
        "MongoDB disconnected unexpectedly"
      );
      if (!this.isConnecting) {
        void this.tryReconnect();
      }
    });

    // Add more detailed connection state logging
    mongoose.connection.on("connecting", () => {});

    mongoose.connection.on("reconnected", () => {});

    // Cleanup on application shutdown
    const cleanup = async () => {
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
      }
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
      }
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  private monitorConnectionPool() {
    const alertService = AlertService.getInstance();
    this.monitorInterval = setInterval(() => {
      // Access the connection pool size safely through mongoose's internal API
      const poolSize =
        (mongoose.connection as any).client?.topology?.connections?.length || 0;
      // console.log(`Current connection pool size: ${poolSize}`);
      // Alert if pool size is getting close to max
      if (poolSize >= options.maxPoolSize! * 0.8) {
        void alertService.alert(
          "POOL_WARNING",
          `Connection pool near capacity: ${poolSize}/${options.maxPoolSize} connections`
        );
      }
    }, 60000); // Check every minute
  }

  public async connect(): Promise<typeof mongoose> {
    try {
      if (mongoose.connection.readyState === 1) {
        return mongoose;
      }

      if (this.isConnecting) {
        console.log("Connection already in progress...");
        while (this.isConnecting) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return mongoose;
      }

      this.isConnecting = true;
      await this.cleanupOldListeners();
      await mongoose.connect(MONGODB_URI, options);

      return mongoose;
    } catch (error) {
      this.isConnecting = false;
      const alertService = AlertService.getInstance();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      void alertService.alert(
        "CONNECTION_FAILED",
        `MongoDB connection failed: ${errorMessage}`
      );

      if (error instanceof Error) {
        console.error("MongoDB connection failed:", error.message, error.stack);
      } else {
        console.error("MongoDB connection failed:", error);
      }
      throw error;
    }
  }
}

const connectDB = async () => {
  try {
    const database = Database.getInstance();
    const mongoose = await database.connect();
    return mongoose;
  } catch (error) {
    throw error;
  }
};

export const db = mongoose;
export default connectDB;
