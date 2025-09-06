import axios from "axios";
import { getToken, getApiUrl } from "./auth";
import type { Book } from "@/app/types/book";

// start lending - save a new book
export const createBook = async (book: Book) => {
  const API_URL = getApiUrl();

  try {
    const response = await axios.post(
      `${API_URL}/api/v1/books`,
      book,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Create Book API (JSON) failed:", error);
    throw error;
  }
};

// Get books（ owner / status / search / paging）
export const getBooks = async (params?: {
  ownerId?: string;
  status?: string;   // listed | unlisted | lent | sold
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Book[]> => {
  const API_URL = getApiUrl();
  const token = getToken();
  if (!token) return [];

  try {
    const response = await axios.get(`${API_URL}/api/v1/books`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        owner_id: params?.ownerId,
        status: params?.status,
        q: params?.q,
        page: params?.page ?? 1,
        page_size: Math.min(params?.pageSize ?? 20, 100),
      },
    });

    const data = response.data;
    const raw: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.data)
      ? data.data
      : [];

    return raw as Book[];
  } catch (error) {
    console.error("Get Books API failed:", error);
    return [];
  }
};
