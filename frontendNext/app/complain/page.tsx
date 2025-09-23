"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { 
  getComplaints, 
  createComplaint, 
  type Complaint,
  type CreateComplaintRequest
} from "@/utils/complaints";

const ComplainPage: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    type: "other" as const,
    subject: "",
    description: "",
    orderId: "",
    respondentId: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Complaints</h1>
            <p className="text-gray-600">Submit and track your complaints</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Complaint
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{complaints.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "pending").length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "investigating").length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complaints.filter(c => c.status === "resolved").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Complaints</h2>
          
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No complaints submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(complaint.status)}
                        <h3 className="font-semibold">{complaint.subject}</h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{complaint.description}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Create Complaint Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Submit New Complaint</h2>
              
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
                >
                  {isSubmitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplainPage;
