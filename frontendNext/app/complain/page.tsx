"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  FileText,
  Calendar,
  User
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { 
  getComplaints, 
  createComplaint,
  updateComplaint,
  type Complaint,
  type CreateComplaintRequest
} from "@/utils/complaints";

const ComplainPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [note, setNote] = useState("");
  const [newComplaint, setNewComplaint] = useState({
    type: "other" as const,
    subject: "",
    description: "",
    orderId: "",
    respondentId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          const complaintsData = await getComplaints();
          // 确保 complaintsData 是数组
          if (Array.isArray(complaintsData)) {
            setComplaints(complaintsData);
          } else {
            console.error("Invalid complaints data format:", complaintsData);
            setComplaints([]);
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Failed to load complaints:", error);
        setComplaints([]); // 确保在错误时设置为空数组
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleCreateComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.description.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const complaintData: CreateComplaintRequest = {
        type: newComplaint.type,
        subject: newComplaint.subject,
        description: newComplaint.description,
        orderId: newComplaint.orderId || undefined,
        respondentId: newComplaint.respondentId || undefined
      };
      
      const createdComplaint = await createComplaint(complaintData);
      if (createdComplaint) {
        setComplaints([createdComplaint, ...complaints]);
        setIsCreateModalOpen(false);
        setNewComplaint({ type: "other", subject: "", description: "", orderId: "", respondentId: "" });
      } else {
        alert("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create complaint:", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!selectedComplaint) return;

    setIsSubmittingUpdate(true);
    try {
      // Call the API to update the complaint
      await updateComplaint(selectedComplaint.id, {
        deductionAmount: deductionAmount || undefined,
        note: note || undefined
      });
      
      alert(`Successfully updated complaint ${selectedComplaint.id}!`);
      
      // Clear the form
      setDeductionAmount("");
      setNote("");
      
      // Refresh the complaints list
      const complaintsData = await getComplaints();
      if (Array.isArray(complaintsData)) {
        setComplaints(complaintsData);
      }
      
    } catch (error: any) {
      console.error("Failed to update complaint:", error);
      let errorMessage = "Failed to update complaint. Please try again.";
      
      if (error.response?.status === 403) {
        errorMessage = "Admin permission required to update complaints.";
      } else if (error.response?.status === 404) {
        errorMessage = "Complaint not found.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "investigating": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "resolved": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "closed": return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "investigating": return "bg-orange-100 text-orange-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "book-condition": return "Book Condition";
      case "delivery": return "Delivery Issue";
      case "user-behavior": return "User Behavior";
      case "other": return "Other";
      default: return "Other";
    }
  };

  // Filter complaints based on search term and status
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    investigating: complaints.filter(c => c.status === "investigating").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
            <p className="text-gray-600">Submit and track your complaints or support requests</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Support
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Panel - Complaints List */}
        <div className="w-1/2 border-r border-gray-200 bg-white">
          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search complaints by subject or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${
                  statusFilter === "all" 
                    ? "bg-black text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>All</span>
                <span className="bg-white bg-opacity-20 px-1 rounded">{statusCounts.all}</span>
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${
                  statusFilter === "pending" 
                    ? "bg-yellow-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Pending</span>
                <span className="bg-white bg-opacity-20 px-1 rounded">{statusCounts.pending}</span>
              </button>
              <button
                onClick={() => setStatusFilter("investigating")}
                className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${
                  statusFilter === "investigating" 
                    ? "bg-orange-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Investigating</span>
                <span className="bg-white bg-opacity-20 px-1 rounded">{statusCounts.investigating}</span>
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${
                  statusFilter === "resolved" 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Resolved</span>
                <span className="bg-white bg-opacity-20 px-1 rounded">{statusCounts.resolved}</span>
              </button>
              <button
                onClick={() => setStatusFilter("closed")}
                className={`px-3 py-1 text-sm rounded-full flex items-center space-x-1 ${
                  statusFilter === "closed" 
                    ? "bg-gray-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>Closed</span>
                <span className="bg-white bg-opacity-20 px-1 rounded">{statusCounts.closed}</span>
              </button>
            </div>
          </div>

          {/* Complaints List */}
          <div className="overflow-y-auto h-full">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No complaints found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedComplaint?.id === complaint.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(complaint.status)}
                        <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)} flex items-center`}>
                        {complaint.status === "investigating" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {complaint.status ? complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1) : "Unknown"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{complaint.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                        <span>Case ID: {complaint.id}</span>
                        {complaint.orderId && <span>Order ID: {complaint.orderId}</span>}
                      </div>
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="w-1/2 bg-gray-50">
          {selectedComplaint ? (
            <div className="h-full overflow-y-auto">
              {/* Details Header */}
              <div className="bg-white p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedComplaint.subject}</h2>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusIcon(selectedComplaint.status)}
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedComplaint.status)}`}>
                        {selectedComplaint.status ? selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1) : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/complain/${selectedComplaint.id}`)}
                  >
                    View Details
                  </Button>
                </div>
                
                {/* Admin Response */}
                {selectedComplaint.adminResponse && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-blue-900 font-medium">Admin Response</p>
                        <p className="text-blue-800 mt-1">{selectedComplaint.adminResponse}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Complaint Info */}
              <div className="p-6 bg-white">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID</label>
                    <p className="text-gray-900">{selectedComplaint.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Time Info</label>
                    <p className="text-gray-900">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>

                {/* Deduction from Deposit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deducted from Deposit
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={deductionAmount}
                      onChange={(e) => setDeductionAmount(e.target.value)}
                      placeholder="AU$"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">* The maximum amount that can be deducted is the total deposit $xx.xx</p>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add additional notes..."
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmitUpdate}
                  disabled={isSubmittingUpdate}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmittingUpdate ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a complaint</h3>
                <p className="text-gray-500">Choose a complaint from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Support Modal */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Submit New Support Request</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newComplaint.type}
                    onChange={(e) => setNewComplaint({...newComplaint, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="other">Other</option>
                    <option value="book-condition">Book Condition</option>
                    <option value="delivery">Delivery Issue</option>
                    <option value="user-behavior">User Behavior</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newComplaint.subject}
                    onChange={(e) => setNewComplaint({...newComplaint, subject: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the issue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide detailed information about your complaint..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewComplaint({ type: "other", subject: "", description: "", orderId: "", respondentId: "" });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateComplaint}
                  disabled={isSubmitting || !newComplaint.subject.trim() || !newComplaint.description.trim()}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ComplainPage;
