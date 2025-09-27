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

  try {
    const response = await axios.get(`${API_URL}/api/v1/books`, {
      // Attach token only if it exists
      // If user is logged in -> send Authorization header
      // If not logged in -> request without token (guest access)
      headers: token ? { Authorization: `Bearer ${token}` } : {},

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

/** Get a book by id */
export const getBookById = async (bookId: string): Promise<Book | null> => {
  const API_URL = getApiUrl();
  const token = getToken();

  try {
    const res = await axios.get(`${API_URL}/api/v1/books/${bookId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
      console.log("Response status:", res.status);

    return res.data as Book;
  } catch (err) {
    console.error("Get Book By Id failed:", err);
    return null;
  }
};

// Upload images
export async function uploadFile (file: File, scene: string): Promise<string> {
  const API_URL = getApiUrl();
  const token = getToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("scene", scene);

  const res = await axios.post(`${API_URL}/upload/image`, formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});


  // return a URL
  return `${API_URL}${res.data.path}`; 
}

// Update book
export async function updateBook(bookId: string, payload: Partial<Book>) {
  const API_URL = getApiUrl();
  const res = await axios.put(`${API_URL}/api/v1/books/${bookId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.data;
}

// delete book
export const deleteBook = async (bookId: string): Promise<boolean> => {
  const API_URL = getApiUrl();
  const token = getToken();
  if (!token) return false;

  try {
    await axios.delete(`${API_URL}/api/v1/books/${bookId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch (error) {
    console.error("Delete Book API failed:", error);
    return false;
  }
};

export interface SearchParams {
  q?: string;
  lang?: string;
  status?: 'listed' | 'unlisted' | 'lent' | 'sold';
  canRent?: boolean;
  canSell?: boolean;
  delivery?: 'post' | 'pickup' | 'both' | 'any';
  minPrice?: number;
  maxPrice?: number;
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export async function searchBooks(params: SearchParams) {
  const API_URL = getApiUrl();
  const token = getToken();
  
  const searchParams = new URLSearchParams();
  
  // Add non-null parameters to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  try {
    const response = await axios.get(`${API_URL}/api/v1/books/search?${searchParams.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return response.data;
  } catch (error) {
    console.error("Search Books API failed:", error);
    throw new Error('Failed to search books');
  }
}