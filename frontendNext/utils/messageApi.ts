import axios from 'axios';
import { getToken, getApiUrl } from "./auth";
import type { Message, ChatThread } from '../app/types/message';

const API_URL = getApiUrl();

// Get all conversations
export async function getConversations() {
  const res = await fetch(`${API_URL}/messages/conversations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 404) return []; // No conversations
    throw new Error("Failed to fetch conversations");
  }
  
  return res.json();
}

// Get conversation with specific user
export async function getConversation(otherUserEmail: string) {
  const res = await fetch(`${API_URL}/messages/conversation/${otherUserEmail}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch conversation");
  }
  return res.json();
}

// Send a text message
export async function sendMessage(receiverEmail: string, content: string) {
  try {
    const res = await axios.post(`${API_URL}/messages/send`, 
      {
        receiver_email: receiverEmail,
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (err: any) {
    if (err.response) {
      console.error("Send message failed:", err.response.data);
      throw new Error("Failed to send message: " + JSON.stringify(err.response.data));
    }
    throw new Error("Failed to send message");
  }
}

// Mark conversation as read
export async function markConversationAsRead(otherUserEmail: string) {
  const res = await fetch(`${API_URL}/messages/mark-conversation-read/${otherUserEmail}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to mark conversation as read");
  }
  return res.json();
}

// Get unread count for specific sender
export async function getUnreadCount(otherUserEmail: string) {
  const res = await fetch(`${API_URL}/messages/unread-count/${otherUserEmail}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to get unread count");
  }
  const data = await res.json();
  return data.unread_count;
}

// Send a message with an image attachment
export async function sendMessageWithImage(receiverEmail: string, content: string | null, file: File) {
  try {
    const formData = new FormData();
    formData.append('receiver_email', receiverEmail);
    if (content) {
      formData.append('content', content);
    }
    formData.append('file', file);

    const res = await fetch(`${API_URL}/messages/send-with-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to send message with image");
    }
    return res.json();
  } catch (err: any) {
    console.error("Send message with image failed:", err);
    throw new Error("Failed to send message with image");
  }
}