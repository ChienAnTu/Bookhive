// types/book.ts

// book interface
export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  //borrowerId?: string;

  // 状态
  status: "listed" | "unlisted" | "lendOut";
  condition: "new" | "like-new" | "good" | "fair";

  // 时间相关
  dateAdded: string;
  updateDate: string;  

  // 书籍属性
  language: string;
  isbn: string;
  tags: string[];
  publishYear: number;
  maxLendingDays: number;

  // 配送
  deliveryMethod: "post" | "self-help" | "both";

  // 费用
  fees: {
    deposit: number; // Security deposit amount (refundable)
    serviceFee: number; // Platform service fee (non-refundable)
    estimatedShipping?: number; // Estimated shipping cost (for post delivery)
  };
}
