import axios from "axios";
import { getApiUrl, getToken } from "@/utils/auth";

const API_URL = getApiUrl();

export type Complaint = {
  id: string;
  orderId?: string;
  complainantId: string;
  respondentId?: string;
  type: "book-condition" | "delivery" | "user-behavior" | "other" | "overdue";
  subject: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "closed";
  adminResponse?: string;
  deductedAmount?: string;
  deductionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateComplaintRequest = {
  orderId?: string;
  respondentId?: string;
  type: "book-condition" | "delivery" | "user-behavior" | "other" | "overdue";
  subject: string;
  description: string;
};

export type MessageCreate = {
  body: string;
};

// 获取投诉列表
export async function getComplaints(isAdmin: boolean = false): Promise<Complaint[]> {
  try {
    const token = getToken();
    if (!token) {
      console.error("No authentication token found");
      return [];
    }
    
    const role = isAdmin ? "admin" : "mine";
    const response = await axios.get(`${API_URL}/api/v1/complaints?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // 后端返回格式: {"items": [complaints]}
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    } else {
      console.error("API returned unexpected data format:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    return [];
  }
}

// 创建新投诉
export async function createComplaint(complaintData: CreateComplaintRequest): Promise<Complaint | null> {
  try {
    const token = getToken();
    if (!token) {
      console.error("No authentication token found");
      return null;
    }
    
    const response = await axios.post(
      `${API_URL}/api/v1/complaints`,
      complaintData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create complaint:", error);
    return null;
  }
}

// 获取特定投诉
export async function getComplaint(complaintId: string): Promise<Complaint> {
  const token = getToken();
  const response = await axios.get(`${API_URL}/api/v1/complaints/${complaintId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// 添加投诉消息
export async function addComplaintMessage(complaintId: string, messageData: MessageCreate): Promise<any> {
  const token = getToken();
  const response = await axios.post(
    `${API_URL}/api/v1/complaints/${complaintId}/messages`,
    messageData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

// 管理员更新投诉状态
export async function updateComplaintStatus(
  complaintId: string, 
  status?: "investigating" | "resolved" | "closed",
  adminResponse?: string
): Promise<Complaint> {
  const token = getToken();
  const response = await axios.post(
    `${API_URL}/api/v1/complaints/${complaintId}/resolve`,
    {
      status,
      adminResponse
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

// 押金扣除 (需要后端实现)
export async function deductDeposit(
  complaintId: string,
  amount: number
): Promise<any> {
  const token = getToken();
  const response = await axios.post(
    `${API_URL}/api/v1/complaints/${complaintId}/deduct-deposit`,
    { amount },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}
