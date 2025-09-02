import { UserData } from '../../utils/auth';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  bookId?: string;
  bookTitle?: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export interface SendMessageData {
  receiverId: string;
  content: string;
  bookId?: string;
}