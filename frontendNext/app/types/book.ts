// book interface

export interface Book {
  id: string;
  titleOr: string;
  titleEn: string;
  originalLanguage: string;
  author: string;
  category: string;
  description: string;
  coverImgUrl?: string;
  ownerId: string;
  // borrowerId?: string;

  // 状态
  status: "listed" | "unlisted" | "lent" | "sold";
  condition: "new" | "like-new" | "good" | "fair";
  conditionImgURLs?: string[];

  canRent: boolean;
  canSell: boolean;
  
  // 时间相关
  dateAdded: string;
  updateDate: string;

  // 书籍属性
  isbn?: string;
  tags: string[];
  publishYear?: number;
  maxLendingDays: number;

  // 配送
  deliveryMethod: "post" | "pickup" | "both";

  // Borrow费用
  // fees: {
  //   serviceFee: number;       // Platform 10% service fee (non-refundable)
  //   estimatedShipping?: number; // Estimated shipping cost (for post delivery)
  // };

  // Sale费用
  salePrice?: number;          // Sale amount (non-refundable)
  deposit?: number;          // Security deposit amount (refundable)

  // serviceFee: number;       // Platform 10% service fee (non-refundable)
  // estimatedShipping?: number; // Estimated shipping cost (for post delivery)


}
