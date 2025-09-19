// Enhanced Complaint Page with full workflow support
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
  DollarSign,
  Settings
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { getCurrentUser, getUserById } from "@/utils/auth";
import { 
  getComplaints, 
  createComplaint, 
  updateComplaintStatus, 
  processDepositDeduction,
  type Complaint,
  type CreateComplaintRequest,
  type UpdateComplaintStatusRequest,
  type DepositDeductionRequest
} from "@/utils/complaints";
import { getBorrowingOrders, type Order } from "@/utils/orders";
import { getBookById } from "@/utils/books";
import type { User } from "@/app/types/user";

type ComplaintStatus = "open" | "in-progress" | "resolved" | "closed";
type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
type FilterStatus = "all" | ComplaintStatus;
type ComplaintSource = "order" | "support" | "system";
type UserRole = "user" | "admin";

export default function EnhancedComplainPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false); // Toggle for admin features
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDepositDeductionModalOpen, setIsDepositDeductionModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("open");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  
  const [newComplaint, setNewComplaint] = useState({
    type: "book-condition" as ComplaintType,
    subject: "",
    description: "",
    orderId: "",
    source: "support" as ComplaintSource
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          setError("Failed to load user information");
          return;
        }
        setCurrentUser(user);

        // Load complaints and orders in parallel
        const [complaintsData, ordersData] = await Promise.all([
          getComplaints(isAdminMode),
          getBorrowingOrders()
        ]);

        setComplaints(complaintsData);
        setAvailableOrders(ordersData);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminMode]);

  // Filter complaints based on current user and admin mode
  const userComplaints = useMemo(() => {
    if (!currentUser) return [];
    
    if (isAdminMode) {
      return complaints; // Admin sees all complaints
    }
    return complaints.filter(complaint => 
      complaint.affectedUsers?.includes(currentUser.id) || 
      complaint.complainantId === currentUser.id
    );
  }, [complaints, currentUser, isAdminMode]);

  const filteredComplaints = useMemo(() => {
    let filtered = userComplaints;
    
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
  }, [userComplaints, selectedFilter, searchTerm]);

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case "open": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "in-progress": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "resolved": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "closed": return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "open": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "in-progress": return "text-orange-700 bg-orange-50 border-orange-200";
      case "resolved": return "text-green-700 bg-green-50 border-green-200";
      case "closed": return "text-gray-700 bg-gray-50 border-gray-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getTypeLabel = (type: ComplaintType) => {
    switch (type) {
      case "book-condition": return "Book Damaged";
      case "delivery": return "Wrong Book Received";
      case "user-behavior": return "Poor Book Condition";
      case "overdue": return "Overdue Issue";
      case "other": return "Other Issue";
      default: return "Other Issue";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-700 bg-red-50 border-red-200";
      case "high": return "text-orange-700 bg-orange-50 border-orange-200";
      case "medium": return "text-blue-700 bg-blue-50 border-blue-200";
      case "low": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
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

  const handleSubmitComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.description.trim()) {
      return;
    }
    
    try {
      const complaintData: CreateComplaintRequest = {
        subject: newComplaint.subject,
        description: newComplaint.description,
        type: newComplaint.type,
        source: newComplaint.source,
        orderId: newComplaint.orderId || undefined
      };

      const createdComplaint = await createComplaint(complaintData);
      console.log("Complaint created:", createdComplaint);
      
      // Reload complaints to include the new one
      const updatedComplaints = await getComplaints(isAdminMode);
      setComplaints(updatedComplaints);
      
      // Show success message
      alert("Your complaint has been submitted successfully!");
    } catch (error) {
      console.error("Failed to create complaint:", error);
      alert("Failed to submit complaint. Please try again.");
      return;
    }
    
    // Reset form and close modal
    setNewComplaint({
      type: "book-condition",
      subject: "",
      description: "",
      orderId: "",
      source: "support"
    });
    setIsNewComplaintModalOpen(false);
  };

  const handleDepositDeduction = async () => {
    if (!deductionAmount || !deductionReason.trim() || !selectedComplaint) {
      return;
    }
    
    const amount = parseFloat(deductionAmount);
    
    try {
      // Use the API deduction function
      const result = await processDepositDeduction(selectedComplaint.id, {
        amount,
        reason: deductionReason
      });
      
      console.log("Deposit deduction processed:", result);
      
      // Show success message
      alert(`Deposit deduction processed successfully!\nDeducted: $${amount}\nRemaining deposit: $${(result.remainingDeposit / 100).toFixed(2)}\nCompensation to owner: $${(result.compensationToOwner / 100).toFixed(2)}`);
      
      // Reload complaints to get updated data
      const updatedComplaints = await getComplaints(isAdminMode);
      setComplaints(updatedComplaints);
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

  const handleStatusUpdate = async () => {
    if (!selectedComplaint) {
      return;
    }
    
    try {
      const updateData: UpdateComplaintStatusRequest = {
        status: newStatus,
        resolutionNotes: resolutionNotes.trim() || undefined
      };

      const updatedComplaint = await updateComplaintStatus(selectedComplaint.id, updateData);
      console.log("Complaint status updated:", updatedComplaint);
      
      // Reload complaints to get updated data
      const updatedComplaints = await getComplaints(isAdminMode);
      setComplaints(updatedComplaints);
      
      alert("Complaint status updated successfully!");
    } catch (error) {
      console.error("Failed to update complaint status:", error);
      alert("Failed to update complaint status. Please try again.");
    }
    
    // Reset form and close modal
    setNewStatus("open");
    setResolutionNotes("");
    setIsStatusUpdateModalOpen(false);
    setSelectedComplaint(null);
  };

  const openStatusUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setResolutionNotes(complaint.resolutionNotes || "");
    setIsStatusUpdateModalOpen(true);
  };

  const filterOptions = [
    { value: "all", label: "All Complaints", count: userComplaints.length },
    { value: "open", label: "Open", count: userComplaints.filter(c => c.status === "open").length },
    { value: "in-progress", label: "In Progress", count: userComplaints.filter(c => c.status === "in-progress").length },
    { value: "resolved", label: "Resolved", count: userComplaints.filter(c => c.status === "resolved").length },
    { value: "closed", label: "Closed", count: userComplaints.filter(c => c.status === "closed").length }
  ];

  const complaintTypeOptions: { value: ComplaintType; label: string }[] = [
    { value: "book-condition", label: "Book Damaged" },
    { value: "delivery", label: "Wrong Book Received" },
    { value: "user-behavior", label: "Poor Book Condition" },
    { value: "overdue", label: "Overdue Issue" },
    { value: "other", label: "Other Issue" }
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isAdminMode ? "Admin - All Complaints" : "Complaints & Support"}
              </h1>
              <p className="text-gray-600">
                {isAdminMode ? "Manage all platform complaints and resolutions" : "Submit and track your complaints and support requests"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Admin Mode Toggle */}
              <Button
                variant={isAdminMode ? "default" : "outline"}
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {isAdminMode ? "Exit Admin" : "Admin View"}
              </Button>
              
              <Button
                onClick={() => setIsNewComplaintModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Complaint
              </Button>
            </div>
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
                          {complaint.priority && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority.toUpperCase()}
                            </span>
                          )}
                          {complaint.createdBy === "system" && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                              AUTO
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{complaint.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('-', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created: {formatDate(complaint.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>ID: {complaint.id}</span>
                      </div>
                      {complaint.orderId && (
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          <span>Order: {complaint.orderId}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin Info */}
                    {isAdminMode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Admin Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-800">Source: </span>
                            <span className="font-medium">{complaint.source}</span>
                          </div>
                          <div>
                            <span className="text-blue-800">Affected Users: </span>
                            <span className="font-medium">{complaint.affectedUsers?.join(", ")}</span>
                          </div>
                          {complaint.escalatedTo && (
                            <div>
                              <span className="text-blue-800">Escalated To: </span>
                              <span className="font-medium">{complaint.escalatedTo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deposit Deduction Info */}
                    {complaint.depositDeduction && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Deposit Deduction Applied
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-yellow-800">
                          <div>
                            <span>Amount: </span>
                            <span className="font-medium">${(complaint.depositDeduction.amount / 100).toFixed(2)}</span>
                          </div>
                          <div>
                            <span>Reason: </span>
                            <span className="font-medium">{complaint.depositDeduction.reason}</span>
                          </div>
                          {complaint.depositDeduction.deductedAt && (
                            <div>
                              <span>Date: </span>
                              <span className="font-medium">{formatDate(complaint.depositDeduction.deductedAt)}</span>
                            </div>
                          )}
                          <div>
                            <span>Type: </span>
                            <span className="font-medium">
                              {complaint.depositDeduction.automaticDeduction ? "Automatic" : "Manual"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {complaint.adminResponse && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Admin Response</h4>
                        <p className="text-green-800 text-sm">{complaint.adminResponse}</p>
                        {complaint.updatedAt && (
                          <p className="text-green-600 text-xs mt-2">
                            Updated: {formatDate(complaint.updatedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {complaint.resolutionNotes && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Resolution Notes</h4>
                        <p className="text-gray-800 text-sm">{complaint.resolutionNotes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Source: {complaint.source} • Created by: {complaint.createdBy}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {complaint.status === "open" && !isAdminMode && (
                          <Button variant="outline" size="sm">
                            Update Complaint
                          </Button>
                        )}
                        {isAdminMode && complaint.status !== "closed" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setIsDepositDeductionModalOpen(true);
                              }}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Deduct Deposit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openStatusUpdateModal(complaint)}
                            >
                              Update Status
                            </Button>
                          </>
                        )}
                      </div>
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
              Related Order (Optional)
            </label>
            <select
              value={newComplaint.orderId}
              onChange={(e) => setNewComplaint({...newComplaint, orderId: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an order (optional)</option>
              {availableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  Order {order.id} - {order.bookIds?.length || 0} book(s)
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <div className="flex flex-col items-center">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload photos or documents to support your complaint
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="evidence-upload"
                  onChange={(e) => {
                    // Handle file upload logic here
                    console.log("Files selected:", e.target.files);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('evidence-upload')?.click()}
                >
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported: JPG, PNG, PDF, DOC (Max 5MB each)
                </p>
              </div>
            </div>
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
        title="Deduct from Deposit"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Administrative Action</h4>
            <p className="text-yellow-800 text-sm">
              This will deduct the specified amount from the borrower's refundable deposit. 
              The remaining amount will be refunded to the borrower, and the deducted amount 
              will be transferred as compensation.
            </p>
          </div>
          
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              disabled={!deductionAmount || !deductionReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Confirm Deduction
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Modal (Admin Only) */}
      <Modal
        isOpen={isStatusUpdateModalOpen}
        onClose={() => setIsStatusUpdateModalOpen(false)}
        title="Update Complaint Status"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Current Complaint</h4>
            {selectedComplaint && (
              <div className="text-sm text-blue-800">
                <p>ID: {selectedComplaint.id}</p>
                <p>Subject: {selectedComplaint.subject}</p>
                <p>Current Status: {selectedComplaint.status}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes (Optional)
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about the resolution or status change..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Status Workflow</h4>
                <p className="text-yellow-800 text-sm">
                  Open → In Progress → Resolved → Closed. Ensure proper workflow progression and 
                  document any resolution details for future reference.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsStatusUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}