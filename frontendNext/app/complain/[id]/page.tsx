"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User as UserIcon,
  FileText,
  Send,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getCurrentUser, getUserById, isAuthenticated } from "@/utils/auth";
import {
  getComplaintDetail,
  addComplaintMessage,
  resolveComplaint,
  type Complaint,
} from "@/utils/complaints";
import type { User } from "@/app/types/user";
import { handlePaymentDispute, compensatePayment } from "@/utils/payments";
import { getOrderById } from "@/utils/borrowingOrders";


const ComplaintDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const complaintId = params.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userCache, setUserCache] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<"adjust" | "overrule">("adjust");
  const [deductionAmount, setDeductionAmount] = useState<number>(0);


  const hasLoaded = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      if (hasLoaded.current) return;
      hasLoaded.current = true;

      if (!isAuthenticated()) {
        router.push("/auth");
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (!userData) {
          router.push("/auth");
          return;
        }

        const adminFlag =
          Boolean(userData.is_admin === true) ||
          userData.is_admin === true ||
          userData.email?.includes("admin");

        setCurrentUser(userData);
        setIsAdmin(adminFlag);

        const detail = await getComplaintDetail(complaintId);
        if (!detail || !detail.complaint) {
          alert("Complaint not found.");
          router.push("/complain");
          return;
        }

        const c = detail.complaint;

        if (
          !adminFlag &&
          c.complainantId !== userData.id &&
          c.respondentId !== userData.id
        ) {
          alert("You don't have permission to view this complaint.");
          router.push("/complain");
          return;
        }

        setComplaint(c);
        setMessages(detail.messages || []);

        const ids = Array.from(
          new Set([
            c.complainantId,
            c.respondentId,
            ...(detail.messages || []).map((m) => m.senderId),
          ])
        ).filter(Boolean) as string[];

        const users = await Promise.all(ids.map((id) => getUserById(id)));
        const map: Record<string, User> = {};
        users.forEach((u) => u && (map[u.id] = u));
        setUserCache(map);
      } catch (err) {
        console.error("Failed to load complaint:", err);
        alert("Unable to load complaint details.");
        router.push("/complain");
      } finally {
        setIsLoading(false);
      }
    };

    if (complaintId) loadData();
  }, [complaintId, router]);

  const handleAddMessage = async () => {
    if (!newMessage.trim() || !complaint?.id) return;
    setIsSubmitting(true);
    try {
      await addComplaintMessage(complaint.id, { body: newMessage });
      const updated = await getComplaintDetail(complaintId);
      if (updated) {
        setComplaint(updated.complaint);
        setMessages(updated.messages || []);
      }
      setNewMessage("");
    } catch {
      alert("Failed to send message.");
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "investigating": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "resolved": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "closed": return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "book-condition": return "Book Condition";
      case "delivery": return "Delivery Issue";
      case "user-behavior": return "User Behavior";
      case "other": return "Other";
      case "overdue": return "Overdue (System)";
      default: return "Unknown";
    }
  };

  if (isLoading)
    return <div className="flex-1 flex justify-center items-center text-gray-500">Loading complaint details...</div>;

  if (!complaint)
    return (
      <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-500">
        <AlertTriangle className="w-16 h-16 text-red-300 mb-4" />
        Complaint not found
        <Button variant="outline" className="mt-4" onClick={() => router.push("/complain")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    );

  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Details</h1>
            <p className="text-gray-600">Case ID: {complaint.id}</p>
          </div>
          <div className={`flex items-center space-x-2 ${getStatusColor(complaint.status)}`}>
            {getStatusIcon(complaint.status)}
            <span className="px-3 py-1 text-sm font-medium rounded-full">{complaint.status}</span>
          </div>
        </div>

        {/* Complaint Info */}
        <Card className="shadow-sm mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">{complaint.subject}</h3>

            {/* Order/Type/Time */}
            <div className="space-y-2 text-sm text-gray-600">
              {complaint.orderId && (
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span>Order ID: {complaint.orderId}</span>
                </div>
              )}

              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                <span>Type: {getTypeLabel(complaint.type)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center mb-1 sm:mb-0">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Created:&nbsp;
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleString("en-AU")
                      : "N/A"}
                  </span>
                </div>

                {complaint.updatedAt && (
                  <div className="flex items-center">
                    <span>
                      Last updated:&nbsp;
                      {new Date(complaint.updatedAt).toLocaleString("en-AU")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* Complainant */}
                <h4 className="font-medium text-gray-900">Complainant</h4>
                <p className="text-sm text-gray-700">
                  {(() => {
                    const u = userCache[complaint.complainantId];
                    if (!u) return "N/A";
                    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                    return fullName || u.name || "N/A";
                  })()}
                </p>

              </div>
              <div>
                {/* Respondent */}
                <h4 className="font-medium text-gray-900">Respondent</h4>
                <p className="text-sm text-gray-700">
                  {(() => {
                    const respondentId = complaint.respondentId ?? "";
                    const u = respondentId ? userCache[respondentId] : undefined;
                    if (!u) return "N/A";
                    const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
                    return fullName || u.name || "N/A";
                  })()}
                </p>

              </div>
            </div>


            {/* Description */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700">{complaint.description}</div>
            </div>

            {/* Admin Response */}
            {complaint.adminResponse && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Solve Result</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div>
                      <p className="text-blue-800 mt-1">{complaint.adminResponse}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Admin actions */}
        {isAdmin && complaint.status !== "closed" && complaint.status !== "resolved" && (
          <>
            {/* Pending -> Start Processing */}
            {complaint.status === "pending" && (
              <div className="flex justify-end mb-6">
                <Button
                  onClick={async () => {
                    if (!confirm("Start processing this complaint?")) return;
                    try {
                      // update to investigating
                      await resolveComplaint(complaint.id, {
                        status: "investigating",
                      });

                      // system note
                      const adminUser = currentUser?.name || currentUser?.email || "Admin";
                      await addComplaintMessage(complaint.id, {
                        body: `${adminUser} started processing this complaint.`,
                      });

                      const updated = await getComplaintDetail(complaintId);
                      if (updated) {
                        setComplaint(updated.complaint);
                        setMessages(updated.messages || []);
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Failed to start processing.");
                    }
                  }}
                  className="bg-black hover:bg-black text-white flex items-center"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Processing
                </Button>
              </div>
            )}

            {/* Investigating -> Solve / Close / Add Note */}
            {complaint.status === "investigating" && (
              <>
                {/* Solve / Close Buttons */}
                <div className="flex justify-end mb-6 space-x-3">
                  <Button
                    variant="outline"
                    className="border-gray-500 text-gray-600 hover:bg-black hover:text-white flex items-center"
                    onClick={async () => {
                      if (!confirm("Are you sure you want to close this complaint?")) return;
                      try {
                        await resolveComplaint(complaint.id, {
                          adminResponse: "Complaint closed without further action.",
                          status: "closed",
                        });
                        alert("Complaint closed successfully.");
                        const updated = await getComplaintDetail(complaintId);
                        if (updated) {
                          setComplaint(updated.complaint);
                          setMessages(updated.messages || []);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Failed to close complaint.");
                      }
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Close Complaint
                  </Button>

                  <Button
                    onClick={() => setShowAdminModal(true)}
                    className="bg-gray-800 hover:bg-black text-white flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Solve Complaint
                  </Button>
                </div>

                {/* Add Note */}
                <Card className="shadow-sm mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add Note</h3>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Add additional information..."
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleAddMessage}
                      disabled={!newMessage.trim() || isSubmitting}
                      className="flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </>
        )}



        {/* Note History */}
        <Card className="shadow-sm mt-6">
          <h3 className="text-lg font-semibold mb-4">Note History</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const sender = userCache[m.senderId];
                const senderName =
                  `${sender?.firstName ?? ""} ${sender?.lastName ?? ""}`.trim() ||
                  sender?.name ||
                  "Unknown";
                const isMe = currentUser?.id === m.senderId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`w-[100%] p-3 rounded-lg ${isMe ? "bg-blue-100 text-blue-900" : "bg-gray-50 text-gray-800"
                        }`}
                    >
                      <p className="text-sm font-medium mb-1">{isMe ? "You" : senderName}</p>
                      <p>{m.body}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(m.createdAt).toLocaleString("en-AU")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Admin Resolution</h2>

            {/* Action selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Type
              </label>
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value as "adjust" | "overrule")}

                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="adjust">Adjust (Deduct Deposit)</option>
                <option value="overrule">Overrule (Reject Dispute)</option>
              </select>
            </div>

            {/* Deduction Amount (AUD) */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deduction Amount (optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deductionAmount.toString()}
                onChange={(e) => setDeductionAmount(parseFloat(e.target.value) || 0)}

                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter deduction amount (e.g. 5.00)"
              />
            </div>


            {/* follow-up note */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solve Result
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={5}
                placeholder="Write official handling notes or resolution..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>


            <div className="flex justify-end mt-4 space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAdminModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  if (!newMessage.trim()) return alert("Please enter solve result.");
                  setIsSubmitting(true);
                  try {
                    // Step 1: Resolve Complaint
                    await resolveComplaint(complaint.id, {
                      adminResponse: newMessage,
                      status: "resolved",
                    });

                    // Step 2: Handle Payment Dispute (if complaint linked to an order)
                    if (complaint.orderId) {
                      console.log("Handling payment dispute for order:", complaint.orderId);

                      try {
                        const amount = deductionAmount || 0;
                        const action = resolutionAction;
                        console.log("Dispute payload:", { amount, action, note: newMessage });

                        // get order's payment_id
                        const order = await getOrderById(complaint.orderId);
                        console.log("Retrieved order:", order);

                        const paymentId = order?.paymentId;
                        if (!paymentId) {
                          console.warn("No payment_id found for this complaint.");
                        } else {
                          console.log("Handling dispute for payment:", paymentId);

                          await handlePaymentDispute(paymentId, {
                            action,
                            note: newMessage,
                            deduction: amount,
                          });
                          console.log("handlePaymentDispute success:", paymentId);

                          // Compensation block (now inside same try)
                          if (action === "adjust") {
                            const destination =
                              order?.owner?.stripe_account_id ||
                              order?.owner?.stripeAccountId ||
                              "acct_fakeBookhive"; // fallback for dev
                            console.log("Trigger compensatePayment with:", {
                              paymentId,
                              destination,
                            });

                            await compensatePayment(paymentId, destination);
                            console.log("Compensation processed successfully.");
                          }
                        }
                      } catch (err) {
                        console.warn("Payment dispute handling failed:", err);
                      }
                    }

                    // Step 3: Refresh
                    const updated = await getComplaintDetail(complaintId);
                    if (updated) {
                      setComplaint(updated.complaint);
                      setMessages(updated.messages || []);
                    }

                    alert("Complaint resolved successfully.");
                    setNewMessage("");
                    setShowAdminModal(false);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to resolve complaint.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="flex items-center bg-gray-800 hover:bg-black text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "Processing..." : "Confirm Solve"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplaintDetailPage;
