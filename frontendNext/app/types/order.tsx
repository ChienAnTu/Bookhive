import { DeliveryMethod } from "./book";

export interface Order {
  id: string;
  bookId: string;
  userId: string;
  ownerId: string;

  // 时间
  startDate: Date;
  endDate: Date;
  returnDate?: Date;

  // 费用
  totalAmount: number;

  // 状态
  status: string; // "active" | "returned" | "overdue"
  deliveryMethod: DeliveryMethod;

  createdAt: Date;
}
