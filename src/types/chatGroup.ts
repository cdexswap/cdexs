export type ChatGroupAPIResponse = {
  [x: string]: Key | null | undefined;
  chatId: string;
  orderId: string;
  content?: string;
  attachment?: Attachment;
  participants: string[];
  roles: {
    [userId: string]: Role;
  };
  unreadMessages?: UnreadMessages;
  lastMessage?: LastMessage;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "closed";
};

export type Attachment = {
  url: string;
  mimeType: string;
  filename: string;
  size: number;
};

export type Role = "buyer" | "seller" | "admin";

export type UnreadMessages = {
  [userId: string]: number;
};

export type LastMessage = {
  content: string;
  timestamp: Date;
  sender: string;
};
