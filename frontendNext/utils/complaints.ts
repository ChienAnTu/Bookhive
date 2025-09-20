import axios from "axios";
import { getApiUrl } from "./auth";

const API_URL = getApiUrl();

export type Complaint = {
  id: string;
  complainantId: string;
  subject: string;
  description: string;
  type: "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
  status: "pending" | "investigating" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: "user" | "system" | "admin";
  source: "order" | "support" | "system";
  affectedUsers?: string[];
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
};

export type CreateComplaintRequest = {
  subject: string;
  description: string;
  type: "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
  orderId?: string;
  source: "order" | "support" | "system";
  priority?: "low" | "medium" | "high" | "urgent";
  evidence?: File[];
};

export type UpdateComplaintStatusRequest = {
  status: "pending" | "investigating" | "resolved" | "closed";
  resolutionNotes?: string;
  adminResponse?: string;
};

export type DepositDeductionRequest = {
  amount: number;
  reason: string;
};

// Get all complaints (admin only)
export async function getComplaints(): Promise<Complaint[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/complaints`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch complaints:", error);
    throw error;
  }
}

// Get current user's complaints
export async function getUserComplaints(): Promise<Complaint[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/complaints/my`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user complaints:", error);
    throw error;
  }
}

// Get complaints by order ID
export async function getComplaintsByOrder(orderId: string): Promise<Complaint[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/orders/${orderId}/complaints`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch complaints for order ${orderId}:`, error);
    throw error;
  }
}

// Get complaints by status
export async function getComplaintsByStatus(status: Complaint["status"]): Promise<Complaint[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/complaints?status=${status}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch complaints with status ${status}:`, error);
    throw error;
  }
}

// Get complaint by ID
export async function getComplaintById(complaintId: string): Promise<Complaint> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/complaints/${complaintId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch complaint ${complaintId}:`, error);
    throw error;
  }
}

// Create a new complaint
export async function createComplaint(complaintData: CreateComplaintRequest): Promise<Complaint> {
  try {
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
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      return response.data;
    } else {
      // Regular JSON request without files
      const response = await axios.post(`${API_URL}/api/v1/complaints`, complaintData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    }
  } catch (error) {
    console.error("Failed to create complaint:", error);
    throw error;
  }
}

// Update complaint status (admin only)
export async function updateComplaintStatus(
  complaintId: string, 
  updateData: UpdateComplaintStatusRequest
): Promise<Complaint> {
  try {
    const response = await axios.patch(
      `${API_URL}/api/v1/complaints/${complaintId}/status`, 
      updateData, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to update complaint ${complaintId} status:`, error);
    throw error;
  }
}

// Process deposit deduction (admin only)
export async function processDepositDeduction(
  complaintId: string, 
  deductionData: DepositDeductionRequest
): Promise<{
  complaint: Complaint;
  deductionAmount: number;
  remainingDeposit: number;
  compensationToOwner: number;
}> {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/complaints/${complaintId}/deposit-deduction`, 
      deductionData, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to process deposit deduction for complaint ${complaintId}:`, error);
    throw error;
  }
}

// Add additional evidence to a complaint
export async function addComplaintEvidence(
  complaintId: string, 
  evidence: File[]
): Promise<Complaint> {
  try {
    const formData = new FormData();
    
    evidence.forEach((file, index) => {
      formData.append(`evidence_${index}`, file);
    });

    const response = await axios.post(
      `${API_URL}/api/v1/complaints/${complaintId}/evidence`, 
      formData, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to add evidence to complaint ${complaintId}:`, error);
    throw error;
  }
}

// Delete a complaint (only if status is pending and user is complainant)
export async function deleteComplaint(complaintId: string): Promise<void> {
  try {
    await axios.delete(`${API_URL}/api/v1/complaints/${complaintId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
  } catch (error) {
    console.error(`Failed to delete complaint ${complaintId}:`, error);
    throw error;
  }
}

// Get complaint statistics
export async function getComplaintStats(): Promise<{
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  closed: number;
  averageResolutionTime: number; // in hours
}> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/complaints/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch complaint stats:", error);
    throw error;
  }
}

// Check if current user is admin
export function isAdmin(userEmail?: string): boolean {
  if (!userEmail) return false;
  
  // Define admin emails here
  const adminEmails = [
    'admin@bookhive.com',
    'admin@bookhive.com.au',
    'admin@example.com',
    // Add more admin emails as needed
  ];
  
  return adminEmails.includes(userEmail.toLowerCase());
}

// Check if user can process deposit deductions
export async function canProcessDepositDeduction(userEmail?: string): Promise<boolean> {
  if (!userEmail) return false;
  
  // For now, use the same admin check
  // Later this could be a separate API call to check permissions
  return isAdmin(userEmail);
}

// Format complaint type for display
export function formatComplaintType(type: Complaint["type"]): string {
  const typeMap = {
    "book-condition": "Book Condition",
    "delivery": "Delivery Issue", 
    "user-behavior": "User Behavior",
    "overdue": "Overdue Return",
    "other": "Other"
  };
  
  return typeMap[type] || type;
}

// Format complaint status for display
export function formatComplaintStatus(status: Complaint["status"]): string {
  const statusMap = {
    "pending": "Pending Review",
    "investigating": "Under Investigation",
    "resolved": "Resolved",
    "closed": "Closed"
  };
  
  return statusMap[status] || status;
}

// Get status color for UI
export function getComplaintStatusColor(status: Complaint["status"]): string {
  const colorMap = {
    "pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "investigating": "bg-blue-100 text-blue-800 border-blue-200",
    "resolved": "bg-green-100 text-green-800 border-green-200",
    "closed": "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
}