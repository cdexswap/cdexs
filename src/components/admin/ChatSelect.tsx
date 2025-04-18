"use client";

import { ChatGroupAPIResponse } from "@/types/chatGroup";

type Props = {
  chat: ChatGroupAPIResponse;
  handleSelectChat: (chatID: string) => void;
};

export const ChatSelect = ({ chat, handleSelectChat }: Props) => {
  return (
    <div
      className="w-full p-4 bg-gray-400 hover:bg-gray-400/80 border border-gray-300 flex items-center rounded-xl cursor-pointer transition-colors"
      onClick={() => handleSelectChat(chat.orderId)}
    >
      <span className="text-lg font-semibold text-gray-800">{chat.orderId}</span>
    </div>
  );
};
