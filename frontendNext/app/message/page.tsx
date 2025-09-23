"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, getApiUrl } from "@/utils/auth";
import type { ChatThread, Message, SendMessageData } from "@/app/types/message";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Avatar from "@/app/components/ui/Avatar";
import type { User } from "@/app/types/user";
import { getConversations, getConversation, sendMessage, markConversationAsRead, sendMessageWithImage } from "@/utils/messageApi";

const API_URL = getApiUrl();
// Add WebSocket URL from environment variable
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        const conversations = await getConversations();
        setThreads(conversations);
        setLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`${WS_URL}/messages/ws?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          // Update threads with new message
          setThreads(prevThreads => {
            const newMessage: Message = {
              id: data.data.message_id,
              content: data.data.content,
              senderId: data.data.sender_email,
              receiverId: data.data.receiver_email,
              timestamp: data.data.timestamp,
              read: false
            };
            const threadIndex = prevThreads.findIndex(t => 
              t.user.id === newMessage.senderId || 
              t.user.id === newMessage.receiverId
            );

            if (threadIndex === -1) return prevThreads;

            const updatedThreads = [...prevThreads];
            const thread = updatedThreads[threadIndex];
            
            updatedThreads[threadIndex] = {
              ...thread,
              messages: [...(thread.messages || []), newMessage],
              lastMessage: newMessage,
              unreadCount: currentUser?.id === newMessage.receiverId 
                ? (thread.unreadCount + 1)
                : thread.unreadCount
            };

            return updatedThreads;
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (currentUser) {
          const token = localStorage.getItem('access_token');
          wsRef.current = new WebSocket(`${WS_URL}/messages/ws?token=${token}`);
        }
      }, 5000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [currentUser]);

  // Handle thread selection
  const handleThreadSelect = async (thread: ChatThread) => {
    setSelectedThread(thread);
    try {
      await markConversationAsRead(thread.user.email);
      // Update thread unread count
      setThreads(prevThreads =>
        prevThreads.map(t =>
          t.user.id === thread.user.id ? { ...t, unreadCount: 0 } : t
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Add file upload handler
  const handleFileUpload = async (file: File) => {
    if (!selectedThread || !currentUser) return;

    try {
      const response = await sendMessageWithImage(
        selectedThread.user.email,
        messageInput,
        file
      );

      // Update UI with new message
      const newMessage: Message = {
        id: response.message_id,
        content: messageInput || '',
        senderId: currentUser.id,
        receiverId: selectedThread.user.id,
        timestamp: new Date().toISOString(),
        read: false,
        imageUrl: response.image_url
      };

      setSelectedThread(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage
        };
      });

      // Update threads list
      setThreads(prev => prev.map(thread =>
        thread.user.id === selectedThread.user.id
          ? {
              ...thread,
              lastMessage: newMessage
            }
          : thread
      ));

      setMessageInput("");
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Update the file input onChange handler
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File size must be less than 5MB');
          return;
        }
        handleFileUpload(file);
      }
    }}
  />
  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread || !currentUser) return;

    try {
      const response = await sendMessage(selectedThread.user.email, messageInput);
      
      // Update UI with new message
      const newMessage = {
        id: response.message_id,
        content: messageInput,
        senderId: currentUser.id,
        receiverId: selectedThread.user.id,
        timestamp: new Date().toISOString(),
        read: false
      };

      setSelectedThread(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage
        };
      });

      // Update threads list
      setThreads(prev => prev.map(thread =>
        thread.user.id === selectedThread.user.id
          ? {
              ...thread,
              lastMessage: newMessage
            }
          : thread
      ));

      setMessageInput("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }


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
              onClick={() => handleThreadSelect(thread)}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Avatar */}
                <Avatar user={thread.user} size={40} />

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
              <Avatar user={selectedThread.user} size={40} />
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
                      {msg.content && <p>{msg.content}</p>}
                      {msg.imageUrl && (
                        <img 
                          src={`${API_URL}${msg.imageUrl}`} 
                          alt="Message attachment" 
                          className="max-w-full rounded-lg mt-2"
                          style={{ maxHeight: '200px' }}
                        />
                      )}
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
                {/* Upload Button */}
                <label className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-md cursor-pointer hover:bg-gray-800 transition">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // TODO: Implement file upload logic
                        console.log('File selected:', file);
                      }
                    }}
                  />
                </label>

                {/* Message Input */}
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1"
                />

                {/* Send Button */}
                <button
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
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