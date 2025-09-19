import axios from "axios";
import { getApiUrl, getToken } from "./auth";

// Type definitions for complaint system
export interface Complaint {
  id: string;
  complainantId: string;
  subject: string;
  description: string;
  type: "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
  status: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: "user" | "system" | "admin";
  source: "order" | "support" | "system";
  affectedUsers?: string[];
  escalatedTo?: string;
  adminResponse?: string;
  resolutionNotes?: string;
  depositDeduction?: {
    amount: number;
    reason: string;
    deductedAt: string;
    deductedBy: string;
    automaticDeduction: boolean;
  };
  evidence?: {
    files: string[];
    uploadedAt: string;
  };
}

export interface CreateComplaintRequest {
  subject: string;
  description: string;
  type: "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
  orderId?: string;
  source: "order" | "support" | "system";
  priority?: "low" | "medium" | "high" | "urgent";
  evidence?: File[];
}

export interface UpdateComplaintStatusRequest {
  status: "open" | "in-progress" | "resolved" | "closed";
  resolutionNotes?: string;
  adminResponse?: string;
}

export interface DepositDeductionRequest {
  amount: number;
  reason: string;
}

// Get all complaints for current user (or all if admin)
export const getComplaints = async (isAdmin: boolean = false): Promise<Complaint[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const endpoint = isAdmin ? "/api/v1/complaints/admin" : "/api/v1/complaints";
    
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    throw error;
  }
};

// Get a specific complaint by ID
export const getComplaintById = async (complaintId: string): Promise<Complaint> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/complaints/${complaintId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch complaint ${complaintId}:`, error);
    throw error;
  }
};

// Create a new complaint
export const createComplaint = async (complaintData: CreateComplaintRequest): Promise<Complaint> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    
    // If there are evidence files, use FormData
    if (complaintData.evidence && complaintData.evidence.length > 0) {
      const formData = new FormData();
      
      // Add complaint data
      formData.append("subject", complaintData.subject);
      formData.append("description", complaintData.description);
      formData.append("type", complaintData.type);
      formData.append("source", complaintData.source);
      
      if (complaintData.orderId) {
        formData.append("orderId", complaintData.orderId);
      }
      if (complaintData.priority) {
        formData.append("priority", complaintData.priority);
      }
      
      // Add evidence files
      complaintData.evidence.forEach((file, index) => {
        formData.append(`evidence_${index}`, file);
      });

      const response = await axios.post(`${API_URL}/api/v1/complaints`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } else {
      // Regular JSON request without files
      const response = await axios.post(`${API_URL}/api/v1/complaints`, complaintData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    }
  } catch (error) {
    console.error("Failed to create complaint:", error);
    throw error;
  }
};

// Update complaint status (admin only)
export const updateComplaintStatus = async (
  complaintId: string, 
  updateData: UpdateComplaintStatusRequest
): Promise<Complaint> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.patch(
      `${API_URL}/api/v1/complaints/${complaintId}/status`, 
      updateData, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to update complaint ${complaintId} status:`, error);
    throw error;
  }
};

// Process deposit deduction (admin only)
export const processDepositDeduction = async (
  complaintId: string, 
  deductionData: DepositDeductionRequest
): Promise<{
  complaint: Complaint;
  deductionAmount: number;
  remainingDeposit: number;
  compensationToOwner: number;
}> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.post(
      `${API_URL}/api/v1/complaints/${complaintId}/deposit-deduction`, 
      deductionData, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to process deposit deduction for complaint ${complaintId}:`, error);
    throw error;
  }
};

// Search/filter complaints
export const searchComplaints = async (params: {
  status?: string;
  type?: string;
  search?: string;
  isAdmin?: boolean;
}): Promise<Complaint[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const queryParams = new URLSearchParams();
    
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.type) queryParams.append("type", params.type);
    if (params.search) queryParams.append("search", params.search);
    
    const endpoint = params.isAdmin ? "/api/v1/complaints/admin" : "/api/v1/complaints";
    const queryString = queryParams.toString();
    const url = queryString ? `${API_URL}${endpoint}?${queryString}` : `${API_URL}${endpoint}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to search complaints:", error);
    throw error;
  }
};

// Get complaint statistics (admin only)
export const getComplaintStats = async (): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byType: Record<string, number>;
  avgResolutionTime: number;
}> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/complaints/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch complaint statistics:", error);
    throw error;
  }
};