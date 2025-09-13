"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/utils/auth";
import type { ChatThread, Message, SendMessageData } from "@/app/types/message";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<Awaited<ReturnType<typeof getCurrentUser>>>(null);
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
    <div className="flex h-[calc(100vh-4rem)] pt-2 bg-white">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
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
      <div className="flex-1 flex flex-col bg-white">
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
                {selectedThread.lastMessage.bookTitle && selectedThread.lastMessage.bookId && (
                  <Link
                    href={`/books/${selectedThread.lastMessage.bookId}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    &lt;&lt; {selectedThread.lastMessage.bookTitle} &gt;&gt;
                  </Link>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedThread.messages?.map((msg) => {
                const isOwn = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? "bg-black text-white rounded-br-none"
                          : "bg-gray-200 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2 items-center">
                {/* Upload Button*/}
                <label className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-md cursor-pointer hover:bg-gray-800 transition">
                  +
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("File selected:", file.name);
                        // TODO: upload logic here
                      }
                    }}
                  />
                </label>

                {/* Message Input */}
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />

                {/* Send Button */}
                <button
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
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