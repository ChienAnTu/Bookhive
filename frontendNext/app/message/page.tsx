"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/utils/auth";
import type { UserData } from "@/utils/auth";
import type { ChatThread, Message, SendMessageData } from "@/app/types/message";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";

// Mock data
const mockChatThreads: ChatThread[] = [
  {
    id: "1",
    user: {
      id: "user1",
      name: "Sarah Johnson",
      avatar: "/avatars/sarah.jpg",
    },
    lastMessage: {
      id: "msg1",
      senderId: "user1",
      receiverId: "currentUser",
      content: "Hi, is this book available?",
      timestamp: new Date().toISOString(),
      bookTitle: "The Midnight Library",
      read: false,
    },
    unreadCount: 1,
  },
];

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadCurrentUser();
  }, []);

  return (
    <div className="flex h-full">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-5rem)]">
          {threads.map((thread) => (
            <Card
              key={thread.user.id}
              className={`m-2 cursor-pointer transition-colors ${
                selectedThread?.user.id === thread.user.id
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedThread(thread)}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
                  {thread.user.avatar && (
                    <img
                      src={thread.user.avatar}
                      alt={thread.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {thread.user.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(thread.lastMessage.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {thread.lastMessage.bookTitle && (
                    <p className="text-xs text-blue-600 mb-1">
                      &lt;&lt; {thread.lastMessage.bookTitle} &gt;&gt;
                    </p>
                  )}
                  <p className="text-sm text-gray-600 truncate">
                    {thread.lastMessage.content}
                  </p>
                </div>

                {/* Unread indicator */}
                {thread.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    {thread.unreadCount}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200">
                {selectedThread.user.avatar && (
                  <img
                    src={selectedThread.user.avatar}
                    alt={selectedThread.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {selectedThread.user.name}
                </h3>
                {selectedThread.lastMessage.bookTitle && (
                  <p className="text-sm text-blue-600">
                    &lt;&lt; {selectedThread.lastMessage.bookTitle} &gt;&gt;
                  </p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Message bubbles would go here */}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    // Handle send message
                    setMessageInput("");
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}