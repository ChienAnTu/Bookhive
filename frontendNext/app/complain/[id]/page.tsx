"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  FileText,
  Send
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getCurrentUser, isAuthenticated } from "@/utils/auth";
import { 
  getComplaint,
  addComplaintMessage,
  type Complaint
} from "@/utils/complaints";

const ComplaintDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);

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
          const complaintData = await getComplaint(complaintId);
          setComplaint(complaintData);
        } else {
          router.push("/login");
        }
      } catch (error: any) {
        console.error("Failed to load complaint details:", error);
        
        if (error.response?.status === 403) {
          alert("You don't have permission to view this complaint.");
          router.push("/complain");
        } else if (error.response?.status === 404) {
          alert("Complaint not found.");
          router.push("/complain");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (complaintId) {
      loadData();
    }
  }, [complaintId, router]);

  const handleAddMessage = async () => {
    if (!newMessage.trim() || !complaint || !complaint.id) return;

    setIsSubmittingMessage(true);
    try {
      await addComplaintMessage(complaint.id, { body: newMessage });
      // Reload complaint data to get updated messages
      const updatedComplaint = await getComplaint(complaintId);
      setComplaint(updatedComplaint);
      setNewMessage("");
    } catch (error: any) {
      console.error("Failed to add message:", error);
      
      let errorMessage = "Failed to send message. Please try again.";
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to add messages to this complaint.";
      } else if (error.response?.status === 404) {
        errorMessage = "Complaint not found.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="w-5 h-5 text-gray-500" />;
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "investigating": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "resolved": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "closed": return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "investigating": return "bg-orange-100 text-orange-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    if (!type) return "Other";
    switch (type) {
      case "book-condition": return "Book Condition";
      case "delivery": return "Delivery Issue";
      case "user-behavior": return "User Behavior";
      case "other": return "Other";
      default: return "Other";
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-500">Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-1 bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Complaint not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/complain")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/complain")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Support
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Details</h1>
              <p className="text-gray-600">Case ID: {complaint.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(complaint.status)}
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(complaint.status)}`}>
              {getStatusText(complaint.status)}
            </span>
          </div>
        </div>

        {/* Complaint Details */}
        <Card className="shadow-sm mb-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Complaint Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{complaint.subject}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>Type: {getTypeLabel(complaint.type)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                    {complaint.orderId && (
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span>Order ID: {complaint.orderId}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <div className="flex items-center space-x-2 mb-4">
                    {getStatusIcon(complaint.status)}
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {getStatusText(complaint.status)}
                    </span>
                  </div>
                  
                  {complaint.updatedAt && (
                    <p className="text-sm text-gray-600">
                      Last updated: {new Date(complaint.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{complaint.description}</p>
              </div>
            </div>

            {/* Admin Response */}
            {complaint.adminResponse && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Admin Response</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-medium">Support Team</p>
                      <p className="text-blue-800 mt-1">{complaint.adminResponse}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Add Message Section */}
        {complaint.status !== "closed" && complaint.status !== "resolved" && (
          <Card className="shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Add Message</h3>
            <div className="space-y-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Add additional information or ask a question..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim() || isSubmittingMessage}
                  className="flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmittingMessage ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailPage;