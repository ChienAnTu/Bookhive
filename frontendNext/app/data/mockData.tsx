// mockData.tsx
import { User } from "@/app/types/user";
import { Book } from "@/app/types/book";
import { Comment, RatingStats } from "@/app/types";
import { LendingItem } from "@/app/types/lending";
import { Complaint, ComplaintType } from "@/app/types/order";

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   location: string;
//   address?: string; // Full address for postal delivery
//   coordinates: {
//     lat: number;
//     lng: number;
//   };
//   rating: number;
//   booksLent: number;
//   booksBorrowed: number;
//   joinDate: string;
//   bio: string;
//   avatar: string;
//   preferredLanguages: string[];
//   maxDistance: number; // kilometers willing to travel
// }

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
  status: "completed" | "ongoing" | "overdue" | "pending" | "shipped" | "in-transit" | "delivered" | "cancelled";
  startDate: string;
  dueDate: string;
  returnedDate?: string;
  rating?: number; // Rating given by the user after transaction
  review?: string; // Review left by the user
  deliveryMethod: "post" | "self-help" | "both";
  location: string; // Location where the transaction took place
  conversationId: string; // Link to the conversation for this order
  createdAt: string; // When the order was created
  shippingInfo?: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: string;
    address: string;
  };
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
    avatar: "/images/users/alice.jpg",
    bio: "Avid reader who loves fiction and sharing books with the community.",
    preferredLanguages: ["English", "Mandarin"],
    createdAt: new Date("2023-01-10"),
  },
  {
    id: "user2",
    firstName: "David",
    lastName: "Chen",
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
    avatar: "/images/users/david.jpg",
    bio: "Collector of classic literature. Always open to lend and borrow.",
    preferredLanguages: ["English"],
    createdAt: new Date("2023-02-05"),
  },
  {
    id: "user3",
    firstName: "Sophia",
    lastName: "Li",
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
    avatar: "/images/users/sophia.jpg",
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
    status: "delivered",
    startDate: "2023-12-01",
    dueDate: "2023-12-21",
    returnedDate: "2023-12-20",
    rating: 5,
    review:
      "Amazing book! Sarah was super helpful and the book was in perfect condition.",
    deliveryMethod: "post",
    location: "Fremantle, WA",
    conversationId: "conv_completed1",
    createdAt: "2023-11-28T10:30:00Z",
    shippingInfo: {
      trackingNumber: "AU123456789",
      carrier: "Australia Post",
      estimatedDelivery: "2023-12-03",
      address: "123 Main St, Fremantle WA 6160"
    },
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
    status: "shipped",
    startDate: "2024-01-15",
    dueDate: "2024-02-15",
    deliveryMethod: "self-help",
    location: "Perth, WA",
    conversationId: "conv_ongoing1",
    createdAt: "2024-01-10T14:20:00Z",
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
    status: "in-transit",
    startDate: "2024-01-15",
    dueDate: "2024-02-15",
    deliveryMethod: "post",
    location: "Perth, WA",
    conversationId: "conv_ongoing2",
    createdAt: "2024-01-12T09:15:00Z",
    shippingInfo: {
      trackingNumber: "AU987654321",
      carrier: "FedEx",
      estimatedDelivery: "2024-01-18",
      address: "456 Ocean Dr, Perth WA 6000"
    },
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
    status: "pending",
    startDate: "2024-01-20",
    dueDate: "2024-02-10",
    deliveryMethod: "post",
    location: "Subiaco, WA",
    conversationId: "conv_ongoing3",
    createdAt: "2024-01-18T16:45:00Z",
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

export const getOrderById = (orderId: string): Order | undefined => {
  return mockOrders.find(order => order.id === orderId);
};

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

// Lending item data for lend page
export const mockLendingItems: LendingItem[] = [
  { id: 1, title: "Harry Potter 1", status: "Listed", listedDate: "2025-09-25" },
  { id: 2, title: "Harry Potter 2", status: "LendOut", listedDate: "2025-09-25", dueDate: "2025-09-25" },
  { id: 3, title: "Harry Potter 3", status: "Unlisted", listedDate: "2025-09-25" },
];

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

// Complaint types data
export const complaintTypes: { value: ComplaintType; label: string }[] = [
  { value: "book-condition", label: "Book Condition" },
  { value: "delivery", label: "Delivery Issue" },
  { value: "user-behavior", label: "User Behavior" },
  { value: "other", label: "Other" }
];

// Predefined tags for reviews
export const reviewTags = [
  'Excellent communication',
  'Fast response',
  'Book in great condition',
  'Easy pickup/delivery',
  'Very reliable',
  'Friendly person',
  'Flexible timing',
  'Professional',
];

// Comment and rating data
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

// Get user's rating statistics
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

// Get order comments
export const getOrderComments = (orderId: string): Comment[] => {
  return mockComments.filter(comment => comment.orderId === orderId);
};

// Get comments given by user
export const getUserGivenComments = (userId: string): Comment[] => {
  return mockComments.filter(comment => comment.reviewerId === userId);
};

// Get comments received by user  
export const getUserReceivedComments = (userId: string): Comment[] => {
  return mockComments.filter(comment => comment.revieweeId === userId);
};
