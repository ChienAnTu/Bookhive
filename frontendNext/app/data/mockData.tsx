// mockData.tsx
import { User } from "@/app/types/user";
import { Book } from "@/app/types/book";
import { Order } from "@/app/types/order";

import { Comment, RatingStats } from "@/app/types";

export interface LendingRequest {
  id: string;
  bookId: string;
  requesterId: string;
  ownerId: string;
  message: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
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
    firstName: "Alice",
    lastName: "Wang",
    name: "Alice Wang",
    email: "alice@example.com",
    phoneNumber: "+61 400 123 456",
    dateOfBirth: { month: "03", day: "12", year: "1995" },
    country: "Australia",
    streetAddress: "123 George St",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000",
    coordinates: { lat: -33.8688, lng: 151.2093 },
    maxDistance: 10,
    avatar: "",
    bio: "Avid reader who loves fiction and sharing books with the community.",
    preferredLanguages: ["English", "Mandarin"],
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "user2",
    firstName: "David",
    lastName: "Chen",
    name: "David Chen",
    email: "david@example.com",
    phoneNumber: "+61 433 987 654",
    dateOfBirth: { month: "07", day: "24", year: "1990" },
    country: "Australia",
    streetAddress: "45 Collins St",
    city: "Melbourne",
    state: "VIC",
    zipCode: "3000",
    coordinates: { lat: -37.8136, lng: 144.9631 },
    maxDistance: 20,
    avatar: "",
    bio: "Collector of classic literature. Always open to lend and borrow.",
    preferredLanguages: ["English"],
    createdAt: new Date("2023-02-05"),
  },
  {
    id: "user3",
    firstName: "Sophia",
    lastName: "Li",
    name: "Sophia Li",
    email: "sophia@example.com",
    phoneNumber: "+61 422 765 321",
    dateOfBirth: { month: "11", day: "05", year: "1998" },
    country: "Australia",
    streetAddress: "78 Queen St",
    city: "Brisbane",
    state: "QLD",
    zipCode: "4000",
    coordinates: { lat: -27.4698, lng: 153.0251 },
    maxDistance: 15,
    avatar: "",
    bio: "Passionate about fantasy novels and community sharing.",
    preferredLanguages: ["English", "Japanese"],
    createdAt: new Date("2023-03-12"),
  },
];


export const mockBooks: Book[] = [
  {
    id: "book1",
    titleOr: "The Midnight Library",
    titleEn: "The Midnight Library",
    originalLanguage: "English",
    author: "Matt Haig",
    category: "Fiction",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-15",
    updateDate: "2024-01-15",
    isbn: "",
    tags: ["life choices", "parallel lives", "self-reflection", "existential"],
    publishYear: 2020,
    maxLendingDays: 21,
    deliveryMethod: "both",
    deposit: 15,
    salePrice: undefined,
  },
  {
    id: "book2",
    titleOr: "Atomic Habits",
    titleEn: "Atomic Habits",
    originalLanguage: "English",
    author: "James Clear",
    category: "Self-Help",
    description:
      "An Easy & Proven Way to Build Good Habits & Break Bad Ones. Transform your life with tiny changes in behavior that deliver remarkable results.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "listed",
    condition: "good",
    canRent: true,
    canSell: true,
    dateAdded: "2024-01-20",
    updateDate: "2024-01-20",
    isbn: "",
    tags: ["habits", "productivity", "self-improvement", "psychology"],
    publishYear: 2018,
    maxLendingDays: 14,
    deliveryMethod: "post",
    deposit: 12,
    salePrice: 25,
  },
  {
    id: "book3",
    titleOr: "Dune",
    titleEn: "Dune",
    originalLanguage: "English",
    author: "Frank Herbert",
    category: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "lent",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2023-12-10",
    updateDate: "2023-12-10",
    isbn: "",
    tags: ["desert planet", "politics", "mysticism", "classic sci-fi"],
    publishYear: 1965,
    maxLendingDays: 30,
    deliveryMethod: "pickup",
    deposit: 18,
    salePrice: undefined,
  },
  {
    id: "book4",
    titleOr: "Dune",
    titleEn: "Dune",
    originalLanguage: "English",
    author: "Frank Herbert",
    category: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, this epic tale follows young Paul Atreides as he navigates a complex web of politics, religion, and mysticism.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "lent",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2023-12-10",
    updateDate: "2023-12-10",
    isbn: "",
    tags: ["desert planet", "politics", "mysticism", "classic sci-fi"],
    publishYear: 1965,
    maxLendingDays: 30,
    deliveryMethod: "pickup",
    deposit: 18,
    salePrice: undefined,
  },
  {
    id: "book5",
    titleOr: "The Seven Husbands of Evelyn Hugo",
    titleEn: "The Seven Husbands of Evelyn Hugo",
    originalLanguage: "English",
    author: "Taylor Jenkins Reid",
    category: "Fiction",
    description:
      "Reclusive Hollywood icon Evelyn Hugo finally decides to tell her life story—but only to unknown journalist Monique Grant.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "listed",
    condition: "good",
    canRent: true,
    canSell: true,
    dateAdded: "2024-01-10",
    updateDate: "2024-01-10",
    isbn: "",
    tags: ["Hollywood", "biography", "love story", "secrets"],
    publishYear: 2017,
    maxLendingDays: 21,
    deliveryMethod: "both",
    salePrice: 20,
    deposit: 14,
  },
  {
    id: "book6",
    titleOr: "Sapiens",
    titleEn: "Sapiens",
    originalLanguage: "English",
    author: "Yuval Noah Harari",
    category: "History",
    description:
      "A brief history of humankind, exploring how Homo sapiens came to dominate the world through cognitive, agricultural, and scientific revolutions.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-05",
    updateDate: "2024-01-05",
    isbn: "",
    tags: [
      "human evolution",
      "civilization",
      "anthropology",
      "thought-provoking",
    ],
    publishYear: 2011,
    maxLendingDays: 28,
    deliveryMethod: "post",
    deposit: 16,
    salePrice: undefined,
  },
  {
    id: "book7",
    titleOr: "Project Hail Mary",
    titleEn: "Project Hail Mary",
    originalLanguage: "English",
    author: "Andy Weir",
    category: "Sci-Fi",
    description:
      "Ryland Grace wakes up on a spaceship with no memory of why he's there. His crewmates are dead and he's apparently humanity's last hope.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-25",
    updateDate: "2024-01-25",
    isbn: "",
    tags: ["space", "mystery", "survival", "humor"],
    publishYear: 2021,
    maxLendingDays: 21,
    deliveryMethod: "both",
    deposit: 17,
    salePrice: undefined,
  },
  {
    id: "book8",
    titleOr: "Norwegian Wood",
    titleEn: "Norwegian Wood",
    originalLanguage: "English",
    author: "Haruki Murakami",
    category: "Fiction",
    description:
      "A nostalgic story of loss and burgeoning sexuality set in late 1960s Tokyo, following student Toru Watanabe as he remembers his past.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    ownerId: "user5",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-18",
    updateDate: "2024-01-18",
    isbn: "",
    tags: ["Tokyo", "1960s", "love", "memory", "Japanese literature"],
    publishYear: 1987,
    maxLendingDays: 21,
    deliveryMethod: "both",
    deposit: 16,
    salePrice: undefined,
  },
  {
    id: "book9",
    titleOr: "The Design of Everyday Things",
    titleEn: "The Design of Everyday Things",
    originalLanguage: "English",
    author: "Don Norman",
    category: "Design",
    description:
      "A powerful primer on how design serves as the communication between object and user, and how to optimize that conduit of communication.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
    ownerId: "user1",
    status: "listed",
    condition: "good",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-22",
    updateDate: "2024-01-22",
    isbn: "",
    tags: ["UX design", "usability", "human-centered design", "technology"],
    publishYear: 1988,
    maxLendingDays: 21,
    deliveryMethod: "pickup",
    deposit: 13,
    salePrice: undefined,
  },
  {
    id: "book10",
    titleOr: "Educated",
    titleEn: "Educated",
    originalLanguage: "English",
    author: "Tara Westover",
    category: "Biography",
    description:
      "A memoir about a woman who grows up in a survivalist family in rural Idaho and eventually earns a PhD from Cambridge University.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    ownerId: "user4",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-12",
    updateDate: "2024-01-12",
    isbn: "",
    tags: ["education", "family", "resilience", "transformation"],
    publishYear: 2018,
    maxLendingDays: 25,
    deliveryMethod: "both",
    deposit: 18,
    salePrice: undefined,
  },
  {
    id: "book11",
    titleOr: "Where the Crawdads Sing",
    titleEn: "Where the Crawdads Sing",
    originalLanguage: "English",
    author: "Delia Owens",
    category: "Fiction",
    description:
      "A coming-of-age story about a girl who raised herself in the marshes of North Carolina, becoming a naturalist and prime suspect in a murder case.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
    ownerId: "user2",
    status: "listed",
    condition: "good",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-08",
    updateDate: "2024-01-08",
    isbn: "",
    tags: ["nature", "mystery", "isolation", "coming of age"],
    publishYear: 2018,
    maxLendingDays: 21,
    deliveryMethod: "post",
    deposit: 15,
    salePrice: undefined,
  },
  {
    id: "book12",
    titleOr: "The Alchemist",
    titleEn: "The Alchemist",
    originalLanguage: "English",
    author: "Paulo Coelho",
    category: "Fiction",
    description:
      "A philosophical novel about a young shepherd's journey to find treasure, discovering the importance of following one's dreams.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    ownerId: "user3",
    status: "listed",
    condition: "good",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-14",
    updateDate: "2024-01-14",
    isbn: "",
    tags: ["dreams", "journey", "philosophy", "self-discovery"],
    publishYear: 1988,
    maxLendingDays: 18,
    deliveryMethod: "both",
    deposit: 12,
    salePrice: undefined,
  },
  {
    id: "book13",
    titleOr: "1984",
    titleEn: "1984",
    originalLanguage: "English",
    author: "George Orwell",
    category: "Fiction",
    description:
      "A dystopian social science fiction novel about totalitarian rule and the struggle for truth and freedom in a surveillance state.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    ownerId: "user5",
    status: "listed",
    condition: "fair",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-06",
    updateDate: "2024-01-06",
    isbn: "",
    tags: ["dystopia", "surveillance", "freedom", "classic literature"],
    publishYear: 1949,
    maxLendingDays: 28,
    deliveryMethod: "pickup",
    deposit: 10,
    salePrice: undefined,
  },
  {
    id: "book14",
    titleOr: "Becoming",
    titleEn: "Becoming",
    originalLanguage: "English",
    author: "Michelle Obama",
    category: "Biography",
    description:
      "The intimate, powerful memoir of the former First Lady of the United States, chronicling her journey from Chicago's South Side to the White House.",
    coverImgUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    ownerId: "user4",
    status: "listed",
    condition: "like-new",
    canRent: true,
    canSell: false,
    dateAdded: "2024-01-30",
    updateDate: "2024-01-30",
    isbn: "",
    tags: ["inspiration", "leadership", "family", "politics"],
    publishYear: 2018,
    maxLendingDays: 21,
    deliveryMethod: "both",
    deposit: 20,
    salePrice: undefined,
  },
];


export const mockOrders: Order[] = [
  {
    id: "order1",
    bookIds: ["book11"], // Where the Crawdads Sing (owner=user2)
    ownerId: "user2",
    borrowerId: "f261c2c6-4853-47b3-9e5c-3",

    status: "COMPLETED",
    startAt: "2023-12-01T00:00:00Z",
    dueAt: "2023-12-22T00:00:00Z", // 21 days
    returnedAt: "2023-12-20T00:00:00Z",
    completedAt: "2023-12-21T08:00:00Z",

    createdAt: "2023-11-28T10:30:00Z",
    updatedAt: "2023-12-21T08:00:00Z",

    deliveryMethod: "post",
    shippingOut: {
      carrier: "AUSPOST",
      trackingNumber: "AU123456789",
      trackingUrl: "https://auspost.com.au/mypost/track/#/details/AU123456789",
    },

    // Pricing（book11.deposit=15 → 1500 cents）
    deposit: { amount: 1500 },
    serviceFee: { amount: 200 },     // $2
    shippingOutFee: { amount: 800 }, // $8
    totalPaid: { amount: 2500 },     // 1500 + 200 + 800
    totalRefunded: { amount: 1500 }, // full deposit
    notes: "Returned early, great condition.",
  },

  {
    id: "order2",
    bookIds: ["book12"], // The Alchemist (owner=user3)
    ownerId: "user3",
    borrowerId: "f261c2c6-4853-47b3-9e5c-3",

    status: "PENDING_SHIPMENT",
    createdAt: "2024-01-10T14:20:00Z",
    updatedAt: "2024-01-10T14:20:00Z",

    deliveryMethod: "pickup", // book12 supports both → choose pickup

    deposit: { amount: 1200 }, // 12 → 1200 cents
    serviceFee: { amount: 200 },
    totalPaid: { amount: 1400 },
    notes: "Pickup to be arranged at UWA library.",
  },

  {
    id: "order3",
    bookIds: ["book3"], // Dune (owner=user1)
    ownerId: "user1",
    borrowerId: "f261c2c6-4853-47b3-9e5c-3",

    status: "BORROWING",
    startAt: "2024-01-15T00:00:00Z",
    dueAt: "2024-02-14T00:00:00Z", // 30 days

    createdAt: "2024-01-12T09:15:00Z",
    updatedAt: "2024-01-15T00:00:00Z",

    deliveryMethod: "pickup",

    deposit: { amount: 1800 }, // 18 → 1800 cents
    serviceFee: { amount: 200 },
    totalPaid: { amount: 2000 },
    notes: "In-person handover completed.",
  },

  {
    id: "order4",
    bookIds: ["book6"], // Sapiens (owner=user2)
    ownerId: "user2",
    borrowerId: "f261c2c6-4853-47b3-9e5c-3",

    status: "PENDING_PAYMENT",
    createdAt: "2024-01-18T16:45:00Z",
    updatedAt: "2024-01-18T16:45:00Z",

    deliveryMethod: "post",

    // unpaid
    deposit: { amount: 1600 }, // 16 → 1600 cents
    serviceFee: { amount: 200 },
    totalPaid: { amount: 0 },
    notes: "Awaiting payment to confirm the order.",
  },

  // Multiple books ordered at same time（owner=user2；delivery=post）
  {
    id: "order5_multi",
    bookIds: ["book11", "book1", "book6"], // owners all = user2
    ownerId: "user2",
    borrowerId: "f261c2c6-4853-47b3-9e5c-3",

    status: "BORROWING",
    createdAt: "2024-02-01T02:00:00Z",
    startAt: "2024-02-01T04:00:00Z",
    // dueAt 统一：max(maxLendingDays) = max(21, 21, 28) = 28
    dueAt: "2024-02-29T04:00:00Z",

    updatedAt: "2024-02-01T04:00:00Z",

    deliveryMethod: "post",
    shippingOut: {
      carrier: "AUSPOST",
      trackingNumber: "AU555666777",
      trackingUrl: "https://auspost.com.au/mypost/track/#/details/AU555666777",
    },

    // 押金合计：book11(15) + book1(15) + book6(16) = 46 → 4600 cents
    deposit: { amount: 4600 },
    serviceFee: { amount: 200 },
    shippingOutFee: { amount: 900 },
    totalPaid: { amount: 4600 + 200 + 900 }, // 5700
    notes: "Multi-book order; all shipped together via AusPost.",
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
  return mockOrders.filter((order) => order.ownerId === userId);
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

export interface Complaint {
  id: string;
  complainantId: string;
  subject: string;
  description: string;
  type: "book-condition" | "delivery" | "user-behavior" | "other";
  status: "pending" | "investigating" | "resolved" | "closed";
  orderId?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt?: string;
}

export const mockComplaints: Complaint[] = [
  {
    id: "complaint1",
    complainantId: "user1",
    subject: "Book condition not as described",
    description: "The book I received was damaged and had several missing pages. This was not mentioned in the listing.",
    type: "book-condition",
    status: "investigating",
    orderId: "order1",
    adminResponse: "We are investigating this issue with the book owner. Thank you for your patience.",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-16T14:20:00Z"
  },
  {
    id: "complaint2",
    complainantId: "user1",
    subject: "Delayed delivery",
    description: "My book order was supposed to arrive 3 days ago but still hasn't been delivered.",
    type: "delivery",
    status: "resolved",
    orderId: "order2",
    adminResponse: "The delivery issue has been resolved with the shipping provider. You should receive your order within 24 hours.",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-12T16:45:00Z"
  },
  {
    id: "complaint3",
    complainantId: "user2",
    subject: "Inappropriate communication",
    description: "The book owner was rude and unprofessional in our communications.",
    type: "user-behavior",
    status: "pending",
    createdAt: "2024-01-20T11:00:00Z"
  }
];

// 评论和评分数据
export const mockComments: Comment[] = [
  {
    id: "comment1",
    orderId: "order1",
    reviewerId: "user1",
    revieweeId: "user2",
    bookId: "book1",
    rating: 5,
    content: "Sarah was an excellent lender! The book was in perfect condition and she was very responsive to messages. Highly recommend!",
    tags: ["friendly", "responsive", "good condition"],
    type: "lender",
    createdAt: "2024-01-22T10:30:00Z",
    isAnonymous: false,
    helpfulCount: 3
  },
  {
    id: "comment2", 
    orderId: "order1",
    reviewerId: "user2",
    revieweeId: "user1",
    bookId: "book1",
    rating: 5,
    content: "Zhenyi was a great borrower. Returned the book on time and in the same condition. Would definitely lend to again!",
    tags: ["punctual", "careful", "trustworthy"],
    type: "borrower",
    createdAt: "2024-01-23T14:20:00Z",
    isAnonymous: false,
    helpfulCount: 2
  },
  {
    id: "comment3",
    orderId: "order2",
    reviewerId: "user3",
    revieweeId: "user1",
    bookId: "book2",
    rating: 4,
    content: "Good experience overall. The book arrived as described and Zhenyi was helpful with pickup arrangements.",
    tags: ["helpful", "organized"],
    type: "lender",
    createdAt: "2024-02-05T16:45:00Z",
    isAnonymous: false,
    helpfulCount: 1
  },
  {
    id: "comment4",
    orderId: "order3",
    reviewerId: "user4",
    revieweeId: "user3",
    bookId: "book3",
    rating: 3,
    content: "Book was okay but had some minor wear that wasn't mentioned. Communication could have been better.",
    tags: ["average condition"],
    type: "lender",
    createdAt: "2024-01-28T09:10:00Z",
    isAnonymous: true,
    helpfulCount: 0
  },
  {
    id: "comment5",
    orderId: "order4",
    reviewerId: "user1",
    revieweeId: "user4",
    bookId: "book4",
    rating: 4,
    content: "Elena was great to work with. Professional and the book handover was smooth.",
    tags: ["professional", "smooth transaction"],
    type: "lender",
    createdAt: "2024-02-10T11:25:00Z",
    isAnonymous: false,
    helpfulCount: 2
  }
];

// 获取用户的评分统计
export const getUserRatingStats = (userId: string): RatingStats => {
  const userComments = mockComments.filter(comment => comment.revieweeId === userId);
  
  if (userComments.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentComments: []
    };
  }

  const totalRating = userComments.reduce((sum, comment) => sum + comment.rating, 0);
  const averageRating = totalRating / userComments.length;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  userComments.forEach(comment => {
    distribution[comment.rating as keyof typeof distribution]++;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: userComments.length,
    ratingDistribution: distribution,
    recentComments: userComments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  };
};

// 获取订单的评论
export const getOrderComments = (orderId: string): Comment[] => {
  return mockComments.filter(comment => comment.orderId === orderId);
};

// 获取用户给出的评论
export const getUserGivenComments = (userId: string): Comment[] => {
  return mockComments.filter(comment => comment.reviewerId === userId);
};

// 获取用户收到的评论  
export const getUserReceivedComments = (userId: string): Comment[] => {
  return mockComments.filter(comment => comment.revieweeId === userId);
};
