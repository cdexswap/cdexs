import mongoose from "mongoose";

interface IMessage extends mongoose.Document {
  orderId: string;
  sender: string;
  receiver: string;
  content?: string;
  attachment?: {
    url: string;
    mimeType: string;
    filename: string;
    size: number;
  };
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

const messageSchema = new mongoose.Schema<IMessage>({
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: String,
    required: true,
  },
  receiver: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: function (this: IMessage) {
      return !this.attachment; // content is required only if there's no attachment
    },
  },
  attachment: {
    url: String,
    mimeType: {
      type: String,
      enum: ["image/jpeg", "image/png", "image/gif"],
    },
    filename: String,
    size: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
});

export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
