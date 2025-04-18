"use client";

import { useEffect, useState } from "react";
import { ChatSelect } from "./ChatSelect";
import ChatAdmin from "./ChatAdmin";
import type { ChatGroupAPIResponse } from "@/types/chatGroup";
import Login from "@/components/admin/FormLogin.";

export default function Index() {
  const [chatGroups, setChatGroups] = useState<ChatGroupAPIResponse[]>([]);
  const [selectChatID, setSelectChatID] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const handleGetAllChatGroups = async () => {
        try {
          const response = await fetch("/api/chatGroup?status=active");
          if (!response.ok) {
            throw new Error("Failed to fetch chat groups");
          }
          const data = await response.json();
          setChatGroups(data);
          console.log("chatGroup response => ", data);
        } catch (error) {
          console.error("Error fetching chat groups:", error);
        }
      };
      handleGetAllChatGroups();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="w-screen h-screen text-white flex flex-col md:flex-row justify-center items-center p-4 md:p-10">
      <div className="w-full md:w-1/3 h-full max-h-full flex flex-col gap-4 items-start p-4 overflow-y-auto">
      {chatGroups.map((chat, index) => (
  <ChatSelect key={`${chat.id}-${index}`} chat={chat} handleSelectChat={setSelectChatID} />
))}


      </div>
      <div className="w-full md:w-2/3 h-full flex items-center justify-center p-4">
        <ChatAdmin orderId={selectChatID} />
      </div>
    </div>
  );
}
