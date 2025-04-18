import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ChatGroup } from "@/lib/models/chatGroup";

// GET /api/chatGroup - Get all chat messages with status = "active"
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    const query: Partial<Record<string, string | undefined>> = {
      status: "active",
    };
    if (orderId) {
      query.orderId = orderId;
    }

    const messages = await ChatGroup.find(query).sort({ createdAt: 1 });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch messages",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/chatGroup - Update status of a chat group
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { chatId, status } = body;

    if (!chatId || !status) {
      return NextResponse.json(
        { error: "Both chatId and status are required" },
        { status: 400 }
      );
    }

    const updatedChat = await ChatGroup.findOneAndUpdate(
      { chatId },
      { status },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json(
        { error: "Chat group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Error updating chat group:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update chat group",
      },
      { status: 500 }
    );
  }
}

// POST /api/chatGroup - Insert new chat group
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      chatId,
      orderId,
      content,
      attachment,
      participants,
      roles,
      status,
    }: {
      chatId: string;
      orderId: string;
      content?: string;
      attachment?: {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
      };
      participants: string[];
      roles: { [userId: string]: "buyer" | "seller" | "admin" };
      status?: "active" | "closed";
    } = body;

    if (!chatId || !orderId || !participants || !roles) {
      return NextResponse.json(
        { error: "chatId, orderId, participants, and roles are required" },
        { status: 400 }
      );
    }

    const existingChat = await ChatGroup.findOne({ chatId });
    if (existingChat) {
      return NextResponse.json(existingChat, { status: 200 });
    }

    //  create new chat
    const newChat = new ChatGroup({
      chatId,
      orderId,
      content,
      attachment,
      participants,
      roles,
      status: status || "active", // set default status is "active"
    });

    const savedChat = await newChat.save();

    return NextResponse.json(savedChat, { status: 201 });
  } catch (error) {
    console.error("Error inserting chat group:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to insert chat group",
      },
      { status: 500 }
    );
  }
}
