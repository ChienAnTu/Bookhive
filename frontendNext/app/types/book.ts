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

  // Status
  status: "listed" | "unlisted" | "lent" | "sold";
  condition: "new" | "like-new" | "good" | "fair";
  conditionImgURLs?: string[];

  canRent: boolean;
  canSell: boolean;
  
  // Time-related
  dateAdded: string;
  updateDate: string;

  // Book properties
  isbn?: string;
  tags: string[];
  publishYear?: number;
  maxLendingDays: number;

  // Delivery
  deliveryMethod: "post" | "pickup" | "both";

  // Borrow fees
  // fees: {
  //   serviceFee: number;       // Platform 10% service fee (non-refundable)
  //   estimatedShipping?: number; // Estimated shipping cost (for post delivery)
  // };

  // Sale fees
  salePrice?: number;          // Sale amount (non-refundable)
  deposit?: number;          // Security deposit amount (refundable)

  // serviceFee: number;       // Platform 10% service fee (non-refundable)
  // estimatedShipping?: number; // Estimated shipping cost (for post delivery)


}
