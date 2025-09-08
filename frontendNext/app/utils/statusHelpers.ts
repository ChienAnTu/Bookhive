import { OrderStatus, ComplaintStatus } from "../types/order";

// Utility functions for order status handling
export const getOrderStatusIcon = (status: OrderStatus): string => {
  switch (status) {
    case "pending": return "Clock";
    case "shipped": return "Package";
    case "in-transit": return "Truck";
    case "delivered": return "CheckCircle";
    case "cancelled": return "AlertCircle";
    case "ongoing": return "Clock";
    case "completed": return "CheckCircle";
    case "overdue": return "AlertCircle";
    default: return "Clock";
  }
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case "shipped": return "text-blue-700 bg-blue-50 border-blue-200";
    case "in-transit": return "text-orange-700 bg-orange-50 border-orange-200";
    case "delivered": return "text-green-700 bg-green-50 border-green-200";
    case "cancelled": return "text-red-700 bg-red-50 border-red-200";
    case "ongoing": return "text-blue-700 bg-blue-50 border-blue-200";
    case "completed": return "text-green-700 bg-green-50 border-green-200";
    case "overdue": return "text-red-700 bg-red-50 border-red-200";
    default: return "text-gray-700 bg-gray-50 border-gray-200";
  }
};

// Utility functions for complaint status handling
export const getComplaintStatusIcon = (status: ComplaintStatus): string => {
  switch (status) {
    case "pending": return "Clock";
    case "investigating": return "AlertTriangle";
    case "resolved": return "CheckCircle";
    case "closed": return "XCircle";
    default: return "Clock";
  }
};

export const getComplaintStatusColor = (status: ComplaintStatus): string => {
  switch (status) {
    case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
    case "investigating": return "text-orange-700 bg-orange-50 border-orange-200";
    case "resolved": return "text-green-700 bg-green-50 border-green-200";
    case "closed": return "text-gray-700 bg-gray-50 border-gray-200";
    default: return "text-gray-700 bg-gray-50 border-gray-200";
  }
};

export const getComplaintTypeLabel = (type: string): string => {
  switch (type) {
    case "book-condition": return "Book Condition";
    case "delivery": return "Delivery Issue";
    case "user-behavior": return "User Behavior";
    case "other": return "Other";
    default: return "Other";
  }
};