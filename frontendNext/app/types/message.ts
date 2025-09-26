export interface Message {
  id: string;
  sender_email: string;
  receiver_email: string;
  content: string;
  timestamp: string;
  bookId?: string;
  bookTitle?: string;
  read: boolean;
  imageUrl?: string;
}

export interface ChatThread {
  id: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name: string;
    email:string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export interface SendMessageData {
  receiverId: string;
  content: string;
  bookId?: string;
}