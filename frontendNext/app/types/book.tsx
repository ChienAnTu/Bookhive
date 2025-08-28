export type DeliveryMethod = "pickup" | "delivery" | "both";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description?: string;
  imageUrl: string;
  ownerId: string;

  // 状态
  isAvailable: boolean;
  condition: string; // "new" | "good" | "fair"

  // 费用
  deposit: number;
  serviceFee: number;

  // 配送
  deliveryMethod: DeliveryMethod;

  createdAt: Date;
}
