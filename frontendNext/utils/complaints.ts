import axios from "axios";
import { getApiUrl, getToken } from "@/utils/auth";

const API_URL = getApiUrl();

export type Complaint = {
  id: string;
  orderId?: string;
  complainantId: string;
  respondentId?: string;
  type: "book-condition" | "delivery" | "user-behavior" | "other";
  subject: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "closed";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  
};

export type Message = {
  id: string;
  complaintId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type ComplaintDetail = {
  complaint: Complaint;
  messages: Message[];
};

export type CreateComplaintRequest = Omit<Complaint, "id" | "status" | "createdAt" | "updatedAt" | "adminResponse" | "complainantId">;

export type MessageCreate = { body: string };

export type ResolveComplaintRequest = {
  status?: "resolved" | "closed" | "investigating";
  adminResponse?: string;
};

export async function getComplaints(
  role: "mine" | "admin" = "mine",
  status?: Complaint["status"]
): Promise<Complaint[]> {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/v1/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { role, status },
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    return [];
  }
}



export async function createComplaint(data: CreateComplaintRequest): Promise<Complaint | null> {
  try {
    const token = getToken();
    const response = await axios.post(`${API_URL}/api/v1/complaints`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create complaint:", error);
    return null;
  }
}


export async function getComplaintDetail(complaintId: string): Promise<ComplaintDetail | null> {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/v1/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get complaint detail:", error);
    return null;
  }
}



export async function addComplaintMessage(complaintId: string, message: MessageCreate): Promise<Message | null> {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/api/v1/complaints/${complaintId}/messages`,
      message,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add complaint message:", error);
    return null;
  }
}


export async function resolveComplaint(complaintId: string, data: ResolveComplaintRequest): Promise<Complaint | null> {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/api/v1/complaints/${complaintId}/resolve`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to resolve complaint:", error);
    return null;
  }
}
