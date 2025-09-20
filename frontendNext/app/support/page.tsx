// app/support/page.tsx
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
  FileText
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { getCurrentUser } from "@/utils/auth";
import { getUserComplaints, createComplaint, type Complaint, type CreateComplaintRequest } from "@/utils/complaints";
import type { User } from "@/app/types/user";

type ComplaintStatus = "pending" | "investigating" | "resolved" | "closed";
type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "overdue" | "other";
type FilterStatus = "all" | ComplaintStatus;

export default function ComplainPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewComplaintModalOpen, setIsNewComplaintModalOpen] = useState(false);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    type: "book-condition" as ComplaintType,
    subject: "",
    description: "",
    orderId: ""
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          const complaints = await getUserComplaints();
          setUserComplaints(complaints);
        }
      } catch (error) {
        console.error("Failed to load user complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleSubmitComplaint = async () => {
    if (!newComplaint.subject.trim() || !newComplaint.description.trim() || !currentUser) {
      return;
    }
    
    try {
      const complaintData: CreateComplaintRequest = {
        type: newComplaint.type,
        subject: newComplaint.subject,
        description: newComplaint.description,
        source: "support",
        priority: "medium",
        ...(newComplaint.orderId && { orderId: newComplaint.orderId })
      };

      const createdComplaint = await createComplaint(complaintData);
      
      // Add the new complaint to the list
      setUserComplaints(prev => [createdComplaint, ...prev]);
      
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

  const filterOptions = [
    { value: "all", label: "All Complaints", count: userComplaints.length },
    { value: "pending", label: "Pending", count: userComplaints.filter(c => c.status === "pending").length },
    { value: "investigating", label: "Investigating", count: userComplaints.filter(c => c.status === "investigating").length },
    { value: "resolved", label: "Resolved", count: userComplaints.filter(c => c.status === "resolved").length },
    { value: "closed", label: "Closed", count: userComplaints.filter(c => c.status === "closed").length }
  ];

  const complaintTypes: { value: ComplaintType; label: string }[] = [
    { value: "book-condition", label: "Book Condition" },
    { value: "delivery", label: "Delivery Issue" },
    { value: "user-behavior", label: "User Behavior" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaints & Support</h1>
              <p className="text-gray-600">Submit and track your complaints and support requests</p>
            </div>
            <Button
              onClick={() => setIsNewComplaintModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Complaint
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
              {complaintTypes.map((type) => (
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
    </div>
  );
}