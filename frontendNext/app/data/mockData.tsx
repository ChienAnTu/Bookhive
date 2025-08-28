// mockData.tsx

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  borrowerId?: string;
  status: "available" | "borrowed" | "requested";
  condition: "new" | "like-new" | "good" | "fair";
  dateAdded: string;
  dueDate?: string;
  language: string;
  isbn?: string;
  publishYear?: number;
  tags: string[];
  availableFrom?: string;
  maxLendingDays: number;
  deliveryMethod: "post" | "self-help" | "both";
  fees: {
    deposit: number; // Security deposit amount (refundable)
    serviceFee: number; // Platform service fee (non-refundable)
    estimatedShipping?: number; // Estimated shipping cost (for post delivery)
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  address?: string; // Full address for postal delivery
  coordinates: {
    lat: number;
    lng: number;
  };
  rating: number;
  booksLent: number;
  booksBorrowed: number;
  joinDate: string;
  bio: string;
  avatar: string;
  preferredLanguages: string[];
  maxDistance: number; // kilometers willing to travel
}

export interface LendingRequest {
  id: string;
  bookId: string;
  requesterId: string;
  ownerId: string;
  message: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
}

export interface Order {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl: string;
  lenderId: string;
  lenderName: string;
  lenderAvatar: string;
  borrowerId: string;
  borrowerName: string;
  borrowerAvatar: string;
  status: "completed" | "ongoing" | "overdue";
  startDate: string;
  dueDate: string;
  returnedDate?: string;
  rating?: number; // Rating given by the user after transaction
  review?: string; // Review left by the user
  deliveryMethod: "post" | "self-help" | "both";
  location: string; // Location where the transaction took place
  conversationId: string; // Link to the conversation for this order
}

export interface Conversation {
  id: string;
  bookId: string;
  lenderId: string;
  borrowerId: string;
  orderId?: string; // Link to the order if request was approved
  status: "active" | "archived" | "completed";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: "text" | "system";
  metadata?: {
    // For system messages
    action?:
      | "request_sent"
      | "request_approved"
      | "request_declined"
      | "order_started"
      | "order_ended";
    // For order approval
    orderTerms?: {
      startDate: string;
      dueDate: string;
      deliveryMethod: string;
      pickupLocation?: string;
    };
  };
}

export const mockUsers: User[] = [
  {
    id: "user1",
    name: "Zhenyi Su",
    email: "zhenyi.su@email.com",
    location: "Perth, Western Australia",
    address: "123 Murray Street, Perth, WA 6000",
    coordinates: { lat: -31.9505, lng: 115.8605 },
    rating: 4.8,
    booksLent: 47,
    booksBorrowed: 23,
    joinDate: "2023-03-15",
    bio: "Avid reader and tech enthusiast. Love sharing great books with fellow readers!",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    preferredLanguages: ["English", "Mandarin"],
    maxDistance: 15,
  },
  {
    id: "user2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    location: "Fremantle, WA",
    address: "456 High Street, Fremantle, WA 6160",
    coordinates: { lat: -32.0569, lng: 115.7439 },
    rating: 4.9,
    booksLent: 18,
    booksBorrowed: 15,
    joinDate: "2022-11-20",
    bio: "Bookworm and coffee lover. Always looking for my next great read!",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    preferredLanguages: ["English", "French"],
    maxDistance: 20,
  },
  {
    id: "user3",
    name: "Marcus Davis",
    email: "marcus.d@email.com",
    location: "Subiaco, WA",
    address: "789 Rokeby Road, Subiaco, WA 6008",
    coordinates: { lat: -31.9474, lng: 115.8208 },
    rating: 4.7,
    booksLent: 9,
    booksBorrowed: 11,
    joinDate: "2023-03-10",
    bio: "History buff and science fiction fan. Happy to share my collection!",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    preferredLanguages: ["English", "Spanish"],
    maxDistance: 25,
  },
  {
    id: "user4",
    name: "Elena Rodriguez",
    email: "elena.r@email.com",
    location: "Cottesloe, WA",
    address: "1234 Marine Parade, Cottesloe, WA 6011",
    coordinates: { lat: -31.9959, lng: 115.7578 },
    rating: 4.6,
    booksLent: 14,
    booksBorrowed: 9,
    joinDate: "2023-02-28",
    bio: "Literature professor who loves sharing diverse stories from around the world.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    preferredLanguages: ["English", "Spanish", "Portuguese"],
    maxDistance: 10,
  },
  {
    id: "user5",
    name: "Hiroshi Tanaka",
    email: "hiroshi.t@email.com",
    location: "Northbridge, WA",
    address: "567 William Street, Northbridge, WA 6003",
    coordinates: { lat: -31.9489, lng: 115.8573 },
    rating: 4.9,
    booksLent: 22,
    booksBorrowed: 13,
    joinDate: "2022-08-15",
    bio: "Manga enthusiast and philosophy reader. Building a bridge between Eastern and Western literature.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    preferredLanguages: ["Japanese", "English"],
    maxDistance: 30,
  },
];

export const mockBooks: Book[] = [
  {
    id: "book1",
    title: "The Midnight Library",
    author: "Matt Haig",
    category: "Fiction",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-15",
    language: "English",
    publishYear: 2020,
    tags: ["life choices", "parallel lives", "self-reflection", "existential"],
    maxLendingDays: 21,
    availableFrom: "2024-02-01",
    deliveryMethod: "both",
    fees: {
      deposit: 15,
      serviceFee: 3,
      estimatedShipping: 8,
    },
  },
  {
    id: "book2",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    description:
      "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Transform your life with tiny changes in behavior that deliver remarkable results.",
    imageUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "available",
    condition: "good",
    dateAdded: "2024-01-20",
    language: "English",
    publishYear: 2018,
    tags: ["habits", "productivity", "self-improvement", "psychology"],
    maxLendingDays: 14,
    deliveryMethod: "post",
    fees: {
      deposit: 12,
      serviceFee: 2,
      estimatedShipping: 6,
    },
  },
  {
    id: "book3",
    title: "Dune",
    author: "Frank Herbert",
    category: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user1",
    borrowerId: "user2",
    status: "borrowed",
    condition: "like-new",
    dateAdded: "2023-12-10",
    dueDate: "2024-02-15",
    language: "English",
    publishYear: 1965,
    tags: ["desert planet", "politics", "mysticism", "classic sci-fi"],
    maxLendingDays: 30,
    deliveryMethod: "self-help",
    fees: {
      deposit: 18,
      serviceFee: 4,
    },
  },
  {
    id: "book4",
    title: "Dune",
    author: "Frank Herbert",
    category: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user1",
    borrowerId: "user2",
    status: "borrowed",
    condition: "like-new",
    dateAdded: "2023-12-10",
    dueDate: "2024-02-15",
    language: "English",
    publishYear: 1965,
    tags: ["desert planet", "politics", "mysticism", "classic sci-fi"],
    maxLendingDays: 30,
    deliveryMethod: "self-help",
    fees: {
      deposit: 18,
      serviceFee: 4,
    },
  },
  {
    id: "book5",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    category: "Fiction",
    description:
      "Reclusive Hollywood icon Evelyn Hugo finally decides to tell her life story—but only to unknown journalist Monique Grant.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "available",
    condition: "good",
    dateAdded: "2024-01-10",
    language: "English",
    publishYear: 2017,
    tags: ["Hollywood", "biography", "love story", "secrets"],
    maxLendingDays: 21,
    deliveryMethod: "both",
    fees: {
      deposit: 14,
      serviceFee: 3,
      estimatedShipping: 7,
    },
  },
  {
    id: "book6",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    description:
      "A brief history of humankind, exploring how Homo sapiens came to dominate the world through cognitive, agricultural, and scientific revolutions.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-05",
    language: "English",
    publishYear: 2011,
    tags: [
      "human evolution",
      "civilization",
      "anthropology",
      "thought-provoking",
    ],
    maxLendingDays: 28,
    deliveryMethod: "post",
    fees: {
      deposit: 16,
      serviceFee: 3,
      estimatedShipping: 9,
    },
  },
  {
    id: "book7",
    title: "Project Hail Mary",
    author: "Andy Weir",
    category: "Sci-Fi",
    description:
      "Ryland Grace wakes up on a spaceship with no memory of why he's there. His crewmates are dead and he's apparently humanity's last hope.",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-25",
    language: "English",
    publishYear: 2021,
    tags: ["space", "mystery", "survival", "humor"],
    maxLendingDays: 21,
    deliveryMethod: "both",
    fees: {
      deposit: 17,
      serviceFee: 4,
      estimatedShipping: 8,
    },
  },
  {
    id: "book8",
    title: "Norwegian Wood",
    author: "Haruki Murakami",
    category: "Fiction",
    description:
      "A nostalgic story of loss and burgeoning sexuality set in late 1960s Tokyo, following student Toru Watanabe as he remembers his past.",
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    ownerId: "user5",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-18",
    language: "English",
    publishYear: 1987,
    tags: ["Tokyo", "1960s", "love", "memory", "Japanese literature"],
    maxLendingDays: 21,
    deliveryMethod: "both",
    fees: {
      deposit: 16,
      serviceFee: 3,
      estimatedShipping: 9,
    },
  },
  {
    id: "book9",
    title: "The Design of Everyday Things",
    author: "Don Norman",
    category: "Design",
    description:
      "A powerful primer on how design serves as the communication between object and user, and how to optimize that conduit of communication.",
    imageUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "available",
    condition: "good",
    dateAdded: "2024-01-22",
    language: "English",
    publishYear: 1988,
    tags: ["UX design", "usability", "human-centered design", "technology"],
    maxLendingDays: 21,
    deliveryMethod: "self-help",
    fees: {
      deposit: 13,
      serviceFee: 3,
    },
  },
  {
    id: "book10",
    title: "Educated",
    author: "Tara Westover",
    category: "Biography",
    description:
      "A memoir about a woman who grows up in a survivalist family in rural Idaho and eventually earns a PhD from Cambridge University.",
    imageUrl:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    ownerId: "user4",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-12",
    language: "English",
    publishYear: 2018,
    tags: ["education", "family", "resilience", "transformation"],
    maxLendingDays: 25,
    deliveryMethod: "both",
    fees: {
      deposit: 18,
      serviceFee: 4,
      estimatedShipping: 8,
    },
  },
  {
    id: "book11",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    category: "Fiction",
    description:
      "A coming-of-age story about a girl who raised herself in the marshes of North Carolina, becoming a naturalist and prime suspect in a murder case.",
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "available",
    condition: "good",
    dateAdded: "2024-01-08",
    language: "English",
    publishYear: 2018,
    tags: ["nature", "mystery", "isolation", "coming of age"],
    maxLendingDays: 21,
    deliveryMethod: "post",
    fees: {
      deposit: 15,
      serviceFee: 3,
      estimatedShipping: 7,
    },
  },
  {
    id: "book12",
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    description:
      "A philosophical novel about a young shepherd's journey to find treasure, discovering the importance of following one's dreams.",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "available",
    condition: "good",
    dateAdded: "2024-01-14",
    language: "English",
    publishYear: 1988,
    tags: ["dreams", "journey", "philosophy", "self-discovery"],
    maxLendingDays: 18,
    deliveryMethod: "both",
    fees: {
      deposit: 12,
      serviceFee: 2,
      estimatedShipping: 6,
    },
  },
  {
    id: "book13",
    title: "1984",
    author: "George Orwell",
    category: "Fiction",
    description:
      "A dystopian social science fiction novel about totalitarian rule and the struggle for truth and freedom in a surveillance state.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user5",
    status: "available",
    condition: "fair",
    dateAdded: "2024-01-06",
    language: "English",
    publishYear: 1949,
    tags: ["dystopia", "surveillance", "freedom", "classic literature"],
    maxLendingDays: 28,
    deliveryMethod: "self-help",
    fees: {
      deposit: 10,
      serviceFee: 2,
    },
  },
  {
    id: "book14",
    title: "Becoming",
    author: "Michelle Obama",
    category: "Biography",
    description:
      "The intimate, powerful memoir of the former First Lady of the United States, chronicling her journey from Chicago's South Side to the White House.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user4",
    status: "available",
    condition: "like-new",
    dateAdded: "2024-01-30",
    language: "English",
    publishYear: 2018,
    tags: ["inspiration", "leadership", "family", "politics"],
    maxLendingDays: 21,
    deliveryMethod: "both",
    fees: {
      deposit: 20,
      serviceFee: 4,
      estimatedShipping: 9,
    },
  },
];

export const mockOrders: Order[] = [
  {
    id: "order1",
    bookId: "book11",
    bookTitle: "The Martian",
    bookAuthor: "Andy Weir",
    bookImageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    lenderId: "user2",
    lenderName: "Sarah Johnson",
    lenderAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    borrowerId: "user1",
    borrowerName: "Zhenyi Su",
    borrowerAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    status: "completed",
    startDate: "2023-12-01",
    dueDate: "2023-12-21",
    returnedDate: "2023-12-20",
    rating: 5,
    review:
      "Amazing book! Sarah was super helpful and the book was in perfect condition.",
    deliveryMethod: "post",
    location: "Fremantle, WA",
    conversationId: "conv_completed1",
  },
  {
    id: "order2",
    bookId: "book12",
    bookTitle: "Educated",
    bookAuthor: "Tara Westover",
    bookImageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    lenderId: "user1",
    lenderName: "Zhenyi Su",
    lenderAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    borrowerId: "user3",
    borrowerName: "Marcus Davis",
    borrowerAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    status: "ongoing",
    startDate: "2024-01-15",
    dueDate: "2024-02-15",
    deliveryMethod: "self-help",
    location: "Perth, WA",
    conversationId: "conv_ongoing1",
  },
  {
    id: "order3",
    bookId: "book3",
    bookTitle: "Dune",
    bookAuthor: "Frank Herbert",
    bookImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    lenderId: "user1",
    lenderName: "Zhenyi Su",
    lenderAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    borrowerId: "user2",
    borrowerName: "Sarah Johnson",
    borrowerAvatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    status: "ongoing",
    startDate: "2024-01-15",
    dueDate: "2024-02-15",
    deliveryMethod: "self-help",
    location: "Perth, WA",
    conversationId: "conv_ongoing2",
  },
  {
    id: "order4",
    bookId: "book13",
    bookTitle: "Becoming",
    bookAuthor: "Michelle Obama",
    bookImageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    lenderId: "user3",
    lenderName: "Marcus Davis",
    lenderAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    borrowerId: "user1",
    borrowerName: "Zhenyi Su",
    borrowerAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    status: "ongoing",
    startDate: "2024-01-20",
    dueDate: "2024-02-10",
    deliveryMethod: "post",
    location: "Subiaco, WA",
    conversationId: "conv_ongoing3",
  },
];

// Helper function to get user data by ID
export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find((user) => user.id === userId);
};

// Helper function to get current user (Zhenyi Su)
export const getCurrentUser = (): User => {
  return mockUsers[0]; // user1 is Zhenyi Su
};

// Helper function to get book data by ID
export function getBookById(id: string) {
  return mockBooks.find((book) => book.id === id);
}

// Helper function to get user's lending orders
export const getUserLendingOrders = (userId: string): Order[] => {
  return mockOrders.filter((order) => order.lenderId === userId);
};

// Helper function to get user's borrowing orders
export const getUserBorrowingOrders = (userId: string): Order[] => {
  return mockOrders.filter((order) => order.borrowerId === userId);
};

// Helper function to get orders by status
export const getOrdersByStatus = (
  userId: string,
  status: Order["status"]
): { lending: Order[]; borrowing: Order[] } => {
  const lendingOrders = getUserLendingOrders(userId).filter(
    (order) => order.status === status
  );
  const borrowingOrders = getUserBorrowingOrders(userId).filter(
    (order) => order.status === status
  );

  return {
    lending: lendingOrders,
    borrowing: borrowingOrders,
  };
};

// Helper function to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}
