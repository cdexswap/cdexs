import mongoose from "mongoose";

interface ChatGroupProps extends mongoose.Document {
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
  roles: {
    [userId: string]: "buyer" | "seller" | "admin";
  };
  unreadMessages?: {
    [userId: string]: number;
  };
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender: string;
  };
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "closed";
}

const ChatGroupProps = new mongoose.Schema<ChatGroupProps>({
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: function (this: ChatGroupProps) {
      return !this.attachment;
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
  participants: {
    type: [String],
    required: true,
  },
  roles: {
    type: Map,
    of: {
      type: String,
      enum: ["buyer", "seller", "admin"],
    },
    required: true,
  },
  unreadMessages: {
    type: Map,
    of: Number,
    default: {},
  },
  lastMessage: {
    content: String,
    timestamp: Date,
    sender: String,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "closed"],
    default: "active",
  },
});

export const ChatGroup =
  mongoose.models.ChatGroup || mongoose.model("ChatGroup", ChatGroupProps);
