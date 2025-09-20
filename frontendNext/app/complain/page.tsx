// app/complain/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Calendar,
  Filter,
  Search,
  FileText,
  DollarSign
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { getCurrentUser } from "@/utils/auth";
import { 
  getUserComplaints, 
  createComplaint, 
  processDepositDeduction,
  isAdmin,
  type Complaint,
  type CreateComplaintRequest,
  type DepositDeductionRequest
} from "@/utils/complaints";
import type { User } from "@/app/types/user";

type ComplaintStatus = "pending" | "investigating" | "resolved" | "closed";
type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
type FilterStatus = "all" | ComplaintStatus;

export default function ComplainPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [isDepositDeductionModalOpen, setIsDepositDeductionModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  
  const [newComplaint, setNewComplaint] = useState({
    type: "book-condition" as ComplaintType,
    subject: "",
    description: "",
    orderId: ""
  });
  
  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if current user is admin
  const userIsAdmin = currentUser ? isAdmin(currentUser.email) : false;

  // Load data - similar to books/[id] page pattern
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user first
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Then get user's complaints
        const complaintsData = await getUserComplaints();
        setComplaints(complaintsData || []);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load complaints. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  const filteredComplaints = useMemo(() => {
    let filtered = complaints; // Use complaints directly since getUserComplaints already filters
    
    if (selectedFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === selectedFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [complaints, selectedFilter, searchTerm]);

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "investigating": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "resolved": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "closed": return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "pending": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "investigating": return "text-orange-700 bg-orange-50 border-orange-200";
      case "resolved": return "text-green-700 bg-green-50 border-green-200";
      case "closed": return "text-gray-700 bg-gray-50 border-gray-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getTypeLabel = (type: ComplaintType) => {
    switch (type) {
      case "book-condition": return "Book Condition";
      case "delivery": return "Delivery Issue";
      case "user-behavior": return "User Behavior";
      case "overdue": return "Overdue";
      case "other": return "Other";
      default: return "Other";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Handle new complaint submission
  const handleSubmitComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.description.trim()) {
      return;
    }
    
    try {
      const complaintData: CreateComplaintRequest = {
        subject: newComplaint.subject,
        description: newComplaint.description,
        type: newComplaint.type,
        source: "support",
        orderId: newComplaint.orderId || undefined
      };

      await createComplaint(complaintData);
      
      // Reload complaints
      const updatedComplaints = await getUserComplaints();
      setComplaints(updatedComplaints || []);
      
      // Reset form and close modal
      setNewComplaint({
        type: "book-condition",
        subject: "",
        description: "",
        orderId: ""
      });
      setIsNewComplaintModalOpen(false);
      
      alert("Complaint submitted successfully!");
    } catch (error) {
      console.error("Failed to create complaint:", error);
      alert("Failed to submit complaint. Please try again.");
    }
  };

  // Handle deposit deduction (admin only)
  const handleDepositDeduction = async () => {
    if (!deductionAmount || !deductionReason.trim() || !selectedComplaint) {
      return;
    }
    
    // Check admin permission
    if (!userIsAdmin) {
      alert("Access denied. Only admin users can process deposit deductions.");
      return;
    }
    
    try {
      const amount = parseFloat(deductionAmount);
      const result = await processDepositDeduction(selectedComplaint.id, {
        amount,
        reason: deductionReason
      });
      
      // Reload complaints
      const updatedComplaints = await getUserComplaints();
      setComplaints(updatedComplaints || []);
      
      alert(`Deposit deduction processed successfully!\nDeducted: $${amount}`);
    } catch (error) {
      console.error("Failed to process deposit deduction:", error);
      alert("Failed to process deposit deduction. Please try again.");
    }
    
    // Reset form and close modal
    setDeductionAmount("");
    setDeductionReason("");
    setIsDepositDeductionModalOpen(false);
    setSelectedComplaint(null);
  };

  const filterOptions = [
    { value: "all", label: "All", count: complaints.length },
    { value: "pending", label: "Pending", count: complaints.filter((c: Complaint) => c.status === "pending").length },
    { value: "investigating", label: "Investigating", count: complaints.filter((c: Complaint) => c.status === "investigating").length },
    { value: "resolved", label: "Resolved", count: complaints.filter((c: Complaint) => c.status === "resolved").length },
    { value: "closed", label: "Closed", count: complaints.filter((c: Complaint) => c.status === "closed").length }
  ];

  const complaintTypeOptions: { value: ComplaintType; label: string }[] = [
    { value: "book-condition", label: "Book Condition" },
    { value: "delivery", label: "Delivery Issue" },
    { value: "user-behavior", label: "User Behavior" },
    { value: "other", label: "Other" }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Support</h1>
              <p className="text-gray-600">Submit and track your complaints or support requests</p>
            </div>
            <Button
              onClick={() => setIsNewComplaintModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Support
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search complaints by subject or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilter === option.value ? "default" : "outline"}
                  onClick={() => setSelectedFilter(option.value as FilterStatus)}
                                    className={`flex items-center gap-2 ${selectedFilter === option.value
                      ? "bg-black text-white hover:bg-gray-800 border-black"
                      : ""
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  {option.label}
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "You haven't submitted any complaints yet"}
                  </p>
                  <Button
                    onClick={() => setIsNewComplaintModalOpen(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Submit Your First Complaint
                  </Button>
                </div>
              </Card>
            ) : (
              filteredComplaints.map((complaint) => (
                <Card key={complaint.id}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {complaint.subject}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            {getTypeLabel(complaint.type)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{complaint.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Submitted: {formatDate(complaint.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>Case ID: {complaint.id}</span>
                      </div>
                      {complaint.orderId && (
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <span>Order ID: {complaint.orderId}</span>
                        </div>
                      )}
                    </div>

                    {complaint.adminResponse && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Admin Response</h4>
                        <p className="text-blue-800 text-sm">{complaint.adminResponse}</p>
                        {complaint.updatedAt && (
                          <p className="text-blue-600 text-xs mt-2">
                            Updated: {formatDate(complaint.updatedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {complaint.status === "pending" && (
                        <Button variant="outline" size="sm">
                          Update Complaint
                        </Button>
                      )}
                      {/* Admin-only deposit deduction button */}
                      {userIsAdmin && complaint.status !== "closed" && complaint.orderId && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsDepositDeductionModalOpen(true);
                          }}
                          className="text-red-600 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Deduct Deposit
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Complaint Modal */}
      <Modal
        isOpen={isNewComplaintModalOpen}
        onClose={() => setIsNewComplaintModalOpen(false)}
        title="Submit New Complaint"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint Type
            </label>
            <select
              value={newComplaint.type}
              onChange={(e) => setNewComplaint({...newComplaint, type: e.target.value as ComplaintType})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {complaintTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={newComplaint.subject}
              onChange={(e) => setNewComplaint({...newComplaint, subject: e.target.value})}
              placeholder="Brief description of the issue"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID (Optional)
            </label>
            <input
              type="text"
              value={newComplaint.orderId}
              onChange={(e) => setNewComplaint({...newComplaint, orderId: e.target.value})}
              placeholder="Related order ID if applicable"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
              placeholder="Please provide detailed information about your complaint..."
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsNewComplaintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={!newComplaint.subject.trim() || !newComplaint.description.trim()}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deposit Deduction Modal (Admin Only) */}
      <Modal
        isOpen={isDepositDeductionModalOpen}
        onClose={() => setIsDepositDeductionModalOpen(false)}
        title="Process Deposit Deduction"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Admin Action Required</h4>
            <p className="text-yellow-800 text-sm">
              This action will deduct the specified amount from the borrower's deposit. 
              Only admin users can perform this action.
            </p>
            {!userIsAdmin && (
              <p className="text-red-800 text-sm font-medium mt-2">
                Access denied: Admin privileges required.
              </p>
            )}
          </div>
          
          {selectedComplaint && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Complaint Details</h4>
              <div className="text-sm text-blue-800">
                <p>ID: {selectedComplaint.id}</p>
                <p>Subject: {selectedComplaint.subject}</p>
                <p>Order ID: {selectedComplaint.orderId}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deduction Amount (AUD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={deductionAmount}
              onChange={(e) => setDeductionAmount(e.target.value)}
              placeholder="0.00"
              disabled={!userIsAdmin}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                !userIsAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Deduction
            </label>
            <textarea
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              placeholder="Explain the reason for this deduction..."
              rows={3}
              disabled={!userIsAdmin}
              className={`w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                !userIsAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDepositDeductionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDepositDeduction}
              disabled={!userIsAdmin || !deductionAmount || !deductionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {userIsAdmin ? 'Process Deduction' : 'Access Denied'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}