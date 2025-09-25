"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getCurrentUser, getApiUrl } from "@/utils/auth";
import { useSearchParams } from 'next/navigation';
import type { ChatThread, Message, SendMessageData } from "@/app/types/message";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Avatar from "@/app/components/ui/Avatar";
import type { User } from "@/app/types/user";
import { getConversations, getConversation, sendMessage, markConversationAsRead, sendMessageWithImage, getUserByEmail } from "@/utils/messageApi";

const API_URL = getApiUrl();
// Add WebSocket URL from environment variable
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const initialRecipientEmail = searchParams.get('to');
  const initialBookId = searchParams.get('bookId');
  const initialBookTitle = searchParams.get('bookTitle');
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

        // If we have an initial recipient, find or create their thread
        if (initialRecipientEmail) {
          const existingThread = conversations.find(
            (thread: { user: { email: string; }; }) => thread.user.email === initialRecipientEmail
          );
          
          if (existingThread) {
            handleThreadSelect(existingThread);
          } else {
            // If no existing thread, fetch the recipient's user data and create a new, temporary thread.
            try {
              const recipientUser = await getUserByEmail(initialRecipientEmail);
              
              const newThread: ChatThread = {
                user: recipientUser,
                messages: [],
                // Create a placeholder lastMessage to avoid type errors and provide context
                lastMessage: {
                  id: `temp-${Date.now()}`,
                  content: `Start a conversation about "${initialBookTitle || 'this book'}"...`,
                  senderId: '',
                  receiverId: '',
                  timestamp: new Date().toISOString(),
                  read: true,
                  bookTitle: initialBookTitle || undefined,
                  bookId: initialBookId || undefined,
                },
                unreadCount: 0,
                id: ""
              };
              // Add the new thread to the list and select it
              setThreads(prevThreads => [newThread, ...prevThreads]);
              setSelectedThread(newThread);
            } catch (apiError) {
              console.error(`Failed to fetch user details for ${initialRecipientEmail}:`, apiError);
              // Optionally, show an error message to the user
            }
          }
          // If we have book info, automatically set up the message
          if (initialBookId && initialBookTitle) {
            setMessageInput(`Book Request: ${initialBookTitle}\n\nHi! I am interested in this book. When would be a good time to arrange pickup/delivery?`);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        
        setLoading(false);
      }
    };
    loadData();
  }, [initialRecipientEmail, initialBookId, initialBookTitle]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`${WS_URL}/api/v1/messages/ws?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const isMessageForSelectedThread = selectedThread && 
            (data.data.sender_email === selectedThread.user.email || 
            data.data.receiver_email === selectedThread.user.email);
          // Update threads with new message
          setThreads(prevThreads => {
            const newMessage: Message = {
              id: data.data.message_id,
              content: data.data.content,
              senderId: data.data.sender_id,
              receiverId: data.data.receiver_id,
              timestamp: data.data.timestamp,
              read: false,
              imageUrl: data.data.image_url
            };

            // Determine the other participant's email based on who sent/received
            const otherParticipantEmail = data.data.sender_email === currentUser?.email 
                                          ? data.data.receiver_email 
                                          : data.data.sender_email;


            const threadIndex = prevThreads.findIndex(t => 
              t.user.email === otherParticipantEmail
            );

            if (threadIndex === -1) {
              // If no existing thread, it might be a new conversation.
              // You might need to fetch the user details for `otherParticipantEmail`
              // and create a new thread object to add to `prevThreads`.
              console.warn(`New message from/to ${otherParticipantEmail}, but no existing thread found.`);
              // For now, we'll just return previous threads, but in a real app,
              // you'd typically want to create a new thread entry here.
              return prevThreads;
            }

            const updatedThreads = [...prevThreads];
            const thread = updatedThreads[threadIndex];
            
            updatedThreads[threadIndex] = {
              ...thread,
              messages: [...(thread.messages || []), newMessage],
              lastMessage: newMessage,
              unreadCount: currentUser.email === data.data.receiver_email && !isMessageForSelectedThread 
                ? (thread.unreadCount + 1)
                : thread.unreadCount
            };

            updatedThreads.sort((a, b) => 
              new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
            );

            return updatedThreads;
          });
          // If the message is for the currently selected thread, append it there too
          if (isMessageForSelectedThread) {
            setSelectedThread(prev => {
              if (!prev) return null;
              const newMessage: Message = {
                id: data.data.message_id,
                content: data.data.content,
                senderId: data.data.sender_id,
                receiverId: data.data.receiver_id,
                timestamp: data.data.timestamp,
                read: true, // Mark as read immediately if in active conversation
                imageUrl: data.data.image_url
              };
              return {
                ...prev,
                messages: [...(prev.messages || []), newMessage],
                lastMessage: newMessage,
                unreadCount: 0 // Clear unread count for the active thread
              };
          });
            // Mark the conversation as read via API if it's the active thread
            markConversationAsRead(data.data.sender_email);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current = ws;
  

    return () => {
      ws.close();
    };
  }, [currentUser, selectedThread]);

  // Handle thread selection
  const handleThreadSelect = async (thread: ChatThread) => {
    setSelectedThread(thread);
    try {
      // Fetch the full conversation history for the selected user
      const messageHistory = await getConversation(thread.user.email);

      setSelectedThread({ ...thread, messages: messageHistory });

      if (thread.unreadCount > 0) { // Only mark as read if there are unread messages
      await markConversationAsRead(thread.user.email);
      // Update thread unread count
      setThreads(prevThreads =>
        prevThreads.map(t =>
          t.user.id === thread.user.id ? { ...t, unreadCount: 0 } : t
        )
      );
    } 
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
        timestamp: response.timestamp, // Use timestamp from response
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
      setThreads(prev => {
        const updatedThreads = prev.map(thread =>
          thread.user.id === selectedThread.user.id
          ? {
              ...thread,
              lastMessage: newMessage,
              unreadCount: thread.user.id === newMessage.receiverId && thread.user.id !== currentUser.id 
              ? thread.unreadCount + 1 
              : thread.unreadCount
            }
          : thread
      );

      // Re-sort to bring the updated thread to the top
        updatedThreads.sort((a, b) => 
          new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        );
        return updatedThreads;
      });

      setMessageInput("");
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to send image. Please try again.');
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread || !currentUser) return;

    try {
      const response = await sendMessage(selectedThread.user.email, messageInput);
      
      // Update UI with new message
      const newMessage: Message = {
        id: response.message_id,
        content: messageInput,
        senderId: currentUser.id,
        receiverId: selectedThread.user.id,
        timestamp: response.timestamp,
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
      setThreads(prev => {
        const updatedThreads = prev.map(thread =>
          thread.user.id === selectedThread.user.id
            ? {
                ...thread,
                lastMessage: newMessage,
                // Ensure the unread count isn't incorrectly incremented for self-sent messages
                unreadCount: thread.user.id === newMessage.receiverId && thread.user.id !== currentUser.id 
                  ? thread.unreadCount + 1 
                  : thread.unreadCount
              }
            : thread
        );
        // Re-sort to bring the updated thread to the top
        updatedThreads.sort((a, b) => 
          new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        );
        return updatedThreads;
      });

      setMessageInput(""); // Clear message input after sending
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
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
                        if (file.size > 5 * 1024 * 1024) { // 5MB limit
                          alert('File size must be less than 5MB');
                          return;
                        }
                        handleFileUpload(file); // Correctly call handleFileUpload
                      }
                      e.target.value = ''; // Clear the input field to allow selecting the same file again
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