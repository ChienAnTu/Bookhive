export * from "./user";
export * from "./book";
export * from "./order";

// 简单的 API 响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
