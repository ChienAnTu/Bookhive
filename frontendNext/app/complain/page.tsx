// app/complain/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Calendar,
  Search
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCurrentUser, getUserById, isAuthenticated } from "@/utils/auth";
import type { User } from "@/app/types/user";
import {
  getComplaints,
  createComplaint,
  type Complaint,
  type CreateComplaintRequest
} from "@/utils/complaints";
import { getOrderById } from "@/utils/borrowingOrders";
import { createPaymentDispute } from "@/utils/payments";
import { uploadFile } from "@/utils/books";


const ComplainPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<{ file: File; url: string }[]>([]);


  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/auth");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          const complaintsData = await getComplaints();
          // Handle the API response format
          if (Array.isArray(complaintsData)) {
            setComplaints(complaintsData);

            // get a batch of user info
            const uniqueIds = Array.from(
              new Set([
                ...complaintsData.map((c) => c.complainantId),
                ...complaintsData.map((c) => c.respondentId).filter(Boolean)
              ])
            ).filter((id): id is string => Boolean(id));

            const userPromises = uniqueIds.map((id) => getUserById(id));
            const users = await Promise.all(userPromises);

            const userMap: Record<string, User> = {};
            users.forEach((u) => {
              if (u) userMap[u.id] = u;
            });
            setUserCache(userMap);


          } else {
            console.error("Invalid complaints data format:", complaintsData);
            setComplaints([]);
          }

        } else {
          router.push("/auth");
        }
      } catch (error) {
        console.error("Failed to load complaints:", error);
        setComplaints([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Handle orderId from URL parameters
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setNewComplaint(prev => ({
        ...prev,
        orderId: orderId
      }));
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const fetchUserName = async (userId: string) => {
    if (!userId) return "Unknown";
    if (userCache[userId]) {
      const user = userCache[userId];
      return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unknown";
    }
    const user = await getUserById(userId);
    if (user) {
      setUserCache((prev) => ({ ...prev, [userId]: user }));
      return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unknown";
    }
    return "Unknown";
  };

  // Handle evidence file uploads
  const handleEvidenceFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          if (file.size > 2 * 1024 * 1024) {
            alert("File size cannot exceed 2MB");
            return null;
          }
          const url = await uploadFile(file, "complaint");
          return { file, url };
        })
      );

      const valid = uploaded.filter((f): f is { file: File; url: string } => f !== null);
      setEvidenceFiles((prev) => [...prev, ...valid]);
    } catch (err) {
      console.error("Evidence file upload failed:", err);
      alert("Failed to upload files. Please try again.");
    }
  };

  // Remove evidence file
  const handleRemoveEvidenceFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const determineRespondentId = async (orderId: string, currentUserId: string) => {
  try {
    const order = await getOrderById(orderId);
    if (!order) return undefined;

    const ownerId = order.owner?.id;
    const borrowerId = order.borrower?.id;

    if (ownerId && borrowerId) {
      // The current user complains the book owner
      if (borrowerId === currentUserId) return ownerId;
      // otherwise
      if (ownerId === currentUserId) return borrowerId;
    }

    return undefined;
  } catch (err) {
    console.warn("Failed to determine respondentId:", err);
    return undefined;
  }
};


  const handleCreateComplaint = async () => {
  if (!newComplaint.subject.trim() || !newComplaint.description.trim()) {
    return;
  }

  setIsSubmitting(true);
  try {
    let respondentId = newComplaint.respondentId;
    if (newComplaint.orderId) {
      respondentId = await determineRespondentId(newComplaint.orderId, currentUser.id);
      console.log("🧩 Auto-detected respondentId:", respondentId);
    }

    const complaintData: CreateComplaintRequest = {
      type: newComplaint.type,
      subject: newComplaint.subject,
      description: newComplaint.description,
      orderId: newComplaint.orderId || undefined,
      respondentId: respondentId || undefined,
    };

    console.log("Creating complaint with data:", complaintData);

    // Step 1: create Complaint
    const createdComplaint = await createComplaint(complaintData);
    console.log("Complaint created:", createdComplaint);

    // Step 2: if has orderID then create Payment Dispute
    if (createdComplaint && newComplaint.orderId) {
      try {
        const order = await getOrderById(newComplaint.orderId);
        const paymentId = order?.paymentId;

        if (paymentId) {
          console.log("Found payment_id:", paymentId);
          await createPaymentDispute(paymentId, {
            user_id: currentUser.id,
            reason: newComplaint.subject || "Related payment issue",
            note: newComplaint.description || "",
          });
          console.log("Payment dispute created successfully.");
        } else {
          console.warn("No paymentId found in order.");
        }
      } catch (err) {
        console.warn("Failed to create payment dispute:", err);
      }
    }

    // Step 3: update list
    if (createdComplaint) {
      setComplaints([createdComplaint, ...complaints]);
    }
    setIsCreateModalOpen(false);
    setNewComplaint({ type: "other", subject: "", description: "", orderId: "", respondentId: "" });
    setEvidenceFiles([]);

    console.log("Complaint flow completed successfully.");
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "investigating": return "In Progress";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
    }
  };

  // Filter complaints based on search query
  const filteredComplaints = complaints.filter((complaint) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const subject = complaint.subject?.toLowerCase() || "";
    const description = complaint.description?.toLowerCase() || "";
    const status = complaint.status?.toLowerCase() || "";
    const orderId = complaint.orderId?.toLowerCase() || "";

    // Get user names from cache
    const complainantName = userCache[complaint.complainantId]
      ? [userCache[complaint.complainantId].firstName, userCache[complaint.complainantId].lastName]
          .filter(Boolean).join(" ").toLowerCase()
      : "";
    const respondentName = userCache[complaint.respondentId]
      ? [userCache[complaint.respondentId].firstName, userCache[complaint.respondentId].lastName]
          .filter(Boolean).join(" ").toLowerCase()
      : "";

    return (
      subject.includes(query) ||
      description.includes(query) ||
      status.includes(query) ||
      orderId.includes(query) ||
      complainantName.includes(query) ||
      respondentName.includes(query)
    );
  });

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
          <div className="flex items-center space-x-3">

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Complaint
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search complaints by subject, description, status, order ID, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
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
          <h2 className="text-xl font-semibold mb-4">
            Complaints
          </h2>

          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No complaints submitted yet</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No complaints match your search</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  className="relative border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/complain/${complaint.id}`)}
                >
                  {/* statuss*/}
                  <div
                    className={`absolute top-3 right-3 flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(complaint.status)}`}
                  >
                    {getStatusIcon(complaint.status)}
                    <span>{getStatusText(complaint.status)}</span>
                  </div>


                  {/* Info */}
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-base font-semibold text-gray-900 pr-24">
                      {complaint.subject}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">{complaint.description}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <p>
                        <span className="font-medium">Complainant:</span>{" "}
                        {complaint.complainantId
                          ? (() => {
                            const user = userCache[complaint.complainantId];
                            if (!user) return "Loading...";
                            const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
                            return fullName || user.name || "Unknown";
                          })()
                          : "N/A"}
                      </p>

                      <p>
                        <span className="font-medium">Respondent:</span>{" "}
                        {complaint.respondentId
                          ? (() => {
                            const user = userCache[complaint.respondentId];
                            if (!user) return "Loading...";
                            const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
                            return fullName || user.name || "Unknown";
                          })()
                          : "N/A"}
                      </p>

                      <p>Created: {new Date(complaint.createdAt).toLocaleDateString()}</p>
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
                    onChange={(e) => setNewComplaint({ ...newComplaint, type: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="other">Other</option>
                    <option value="book-condition">Book Condition</option>
                    <option value="delivery">Delivery Issue</option>
                    <option value="user-behavior">User Behavior</option>
                    <option value="overdue">Overdue (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newComplaint.orderId}
                    onChange={(e) => setNewComplaint({ ...newComplaint, orderId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter order ID if complaint is related to a specific order"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newComplaint.subject}
                    onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
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
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide detailed information about your complaint..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidence Images (Optional)
                  </label>
                  <input
                    type="file"
                    id="evidence-upload"
                    accept="image/*"
                    multiple
                    onChange={handleEvidenceFiles}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("evidence-upload")?.click()}
                  >
                    Upload Evidence
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload images to support your complaint (max 2MB per file)
                  </p>

                  {/* Preview evidence images */}
                  {evidenceFiles.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {evidenceFiles.map((f, i) => (
                        <div key={i} className="relative">
                          <img
                            src={f.url || (f.file ? URL.createObjectURL(f.file) : "")}
                            alt={`Evidence ${i + 1}`}
                            className="h-20 w-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidenceFile(i)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewComplaint({ type: "other", subject: "", description: "", orderId: "", respondentId: "" });
                    setEvidenceFiles([]);
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