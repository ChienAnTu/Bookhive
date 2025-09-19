// Support Page with complaint submission functionality
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Phone, 
  Mail,
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Book, 
  Truck, 
  DollarSign, 
  User, 
  Send,
  AlertTriangle
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { getCurrentUser } from "@/utils/auth";
import { createComplaint, type CreateComplaintRequest } from "@/utils/complaints";

type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "other";
type SupportTopic = "complaint" | "general-help" | "account" | "billing" | "technical";

export default function SupportPage() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState<SupportTopic | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [complaintForm, setComplaintForm] = useState({
    type: "book-condition" as ComplaintType,
    subject: "",
    description: "",
    orderId: "",
    urgency: "medium" as "low" | "medium" | "high"
  });
  const [generalForm, setGeneralForm] = useState({
    topic: "",
    message: "",
    email: "",
    preferredContact: "email" as "email" | "phone"
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    loadUser();
  }, []);

  const supportTopics = [
    {
      id: "complaint" as SupportTopic,
      title: "Submit a Complaint",
      description: "Report issues with books, deliveries, or user behavior",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50 border-red-200"
    },
    {
      id: "general-help" as SupportTopic,
      title: "General Help",
      description: "Get help with using BookHive features",
      icon: HelpCircle,
      color: "text-blue-600 bg-blue-50 border-blue-200"
    },
    {
      id: "account" as SupportTopic,
      title: "Account Issues",
      description: "Password resets, profile updates, verification",
      icon: User,
      color: "text-green-600 bg-green-50 border-green-200"
    },
    {
      id: "billing" as SupportTopic,
      title: "Billing & Payments",
      description: "Deposits, refunds, payment issues",
      icon: DollarSign,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200"
    },
    {
      id: "technical" as SupportTopic,
      title: "Technical Issues",
      description: "App bugs, website problems, technical support",
      icon: FileText,
      color: "text-purple-600 bg-purple-50 border-purple-200"
    }
  ];

  const complaintTypes = [
    { value: "book-condition", label: "Book Damaged", icon: Book },
    { value: "delivery", label: "Wrong Book Received", icon: Truck },
    { value: "user-behavior", label: "Poor Book Condition", icon: User },
    { value: "other", label: "Other Issues", icon: MessageSquare }
  ];

  const frequentlyAskedQuestions = [
    {
      question: "How do I report a damaged book?",
      answer: "Use the 'Submit a Complaint' option above and select 'Book Condition Issues'. Provide photos and detailed description of the damage."
    },
    {
      question: "What happens if I return a book late?",
      answer: "Late fees may apply. Check your order details for specific terms. You can also submit a complaint if you believe the delay was not your fault."
    },
    {
      question: "How do I get my deposit back?",
      answer: "Deposits are automatically processed after successful return. If you haven't received it within 5-7 business days, contact our billing support."
    },
    {
      question: "Can I extend my borrowing period?",
      answer: "Contact the book owner through the chat feature to discuss extensions. Note that system-generated overdue complaints may still apply."
    }
  ];

  const handleComplaintSubmit = async () => {
    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) {
      return;
    }

    try {
      setLoading(true);
      
      const complaintData: CreateComplaintRequest = {
        subject: complaintForm.subject,
        description: complaintForm.description,
        type: complaintForm.type,
        source: "support",
        priority: complaintForm.urgency === "high" ? "urgent" : complaintForm.urgency,
        orderId: complaintForm.orderId || undefined
      };

      const createdComplaint = await createComplaint(complaintData);
      console.log("Support complaint created:", createdComplaint);

      // Show success message and redirect
      alert("Your complaint has been submitted successfully! You will be redirected to view all your complaints.");
      router.push("/complain");
    } catch (error) {
      console.error("Failed to create complaint:", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralSubmit = () => {
    if (!generalForm.topic.trim() || !generalForm.message.trim()) {
      return;
    }
    
    console.log("Submitting general support request:", generalForm);
    
    // Reset form
    setGeneralForm({
      topic: "",
      message: "",
      email: "",
      preferredContact: "email"
    });
    setSelectedTopic(null);
    
    // Show success message
    alert("Your support request has been submitted. We'll get back to you within 24 hours.");
  };

  const renderComplaintForm = () => (
    <Modal
      isOpen={isComplaintModalOpen}
      onClose={() => setIsComplaintModalOpen(false)}
      title="Submit a Complaint"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Submit a Complaint</h3>
            <p className="text-gray-600">Report issues that require investigation and resolution</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {complaintTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    complaintForm.type === type.value
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setComplaintForm({...complaintForm, type: type.value as ComplaintType})}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level
          </label>
          <select
            value={complaintForm.urgency}
            onChange={(e) => setComplaintForm({...complaintForm, urgency: e.target.value as "low" | "medium" | "high"})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="low">Low - Not time-sensitive</option>
            <option value="medium">Medium - Moderate urgency</option>
            <option value="high">High - Urgent attention needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Order ID (Optional)
          </label>
          <input
            type="text"
            value={complaintForm.orderId}
            onChange={(e) => setComplaintForm({...complaintForm, orderId: e.target.value})}
            placeholder="Enter order ID if this complaint is related to a specific order"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={complaintForm.subject}
            onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
            placeholder="Brief summary of your complaint"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description *
          </label>
          <textarea
            value={complaintForm.description}
            onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
            placeholder="Please provide detailed information about your complaint. Include dates, order numbers, and any relevant evidence."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Important Note</h4>
              <p className="text-yellow-800 text-sm">
                Complaints will be reviewed by our admin team. Depending on the severity and investigation outcome,
                deposit deductions may apply for verified violations. False complaints may result in account restrictions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsComplaintModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplaintSubmit}
            disabled={!complaintForm.subject.trim() || !complaintForm.description.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Submit Complaint
          </Button>
        </div>
      </div>
    </Modal>
  );

  const renderGeneralForm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">General Support</h3>
          <p className="text-gray-600">Get help with questions or general assistance</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topic *
        </label>
        <input
          type="text"
          value={generalForm.topic}
          onChange={(e) => setGeneralForm({...generalForm, topic: e.target.value})}
          placeholder="What do you need help with?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Message *
        </label>
        <textarea
          value={generalForm.message}
          onChange={(e) => setGeneralForm({...generalForm, message: e.target.value})}
          placeholder="Please describe your question or what you need help with..."
          rows={5}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email
        </label>
        <input
          type="email"
          value={generalForm.email}
          onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})}
          placeholder="We'll use your account email if left blank"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Contact Method
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="email"
              checked={generalForm.preferredContact === "email"}
              onChange={(e) => setGeneralForm({...generalForm, preferredContact: e.target.value as "email" | "phone"})}
              className="mr-2"
            />
            <Mail className="w-4 h-4 mr-1" />
            Email
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="phone"
              checked={generalForm.preferredContact === "phone"}
              onChange={(e) => setGeneralForm({...generalForm, preferredContact: e.target.value as "email" | "phone"})}
              className="mr-2"
            />
            <Phone className="w-4 h-4 mr-1" />
            Phone
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => setSelectedTopic(null)}
        >
          Back
        </Button>
        <Button
          onClick={handleGeneralSubmit}
          disabled={!generalForm.topic.trim() || !generalForm.message.trim()}
        >
          <Send className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>
    </div>
  );

  if (selectedTopic === "complaint") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          {renderComplaintForm()}
        </Card>
      </div>
    );
  }

  if (selectedTopic === "general-help" || selectedTopic === "account" || selectedTopic === "billing" || selectedTopic === "technical") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          {renderGeneralForm()}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          Get help with your BookHive experience. Choose from the options below or browse our FAQ.
        </p>
      </div>

      {/* Support Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {supportTopics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card
              key={topic.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                if (topic.id === "complaint") {
                  setIsComplaintModalOpen(true);
                } else {
                  setSelectedTopic(topic.id);
                }
              }}
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${topic.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-gray-600 text-sm">{topic.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">View My Complaints</h3>
                <p className="text-gray-600 text-sm">Check status of existing complaints</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/complain")}
              >
                View
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">My Orders</h3>
                <p className="text-gray-600 text-sm">Review your borrowing and lending history</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/borrowing")}
              >
                View
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {frequentlyAskedQuestions.map((faq, index) => (
            <Card key={index} className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Still Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Response Times</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>Urgent complaints: Within 2 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>General complaints: Within 24 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Support requests: Within 48 hours</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@bookhive.com.au</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1800 BOOK HIVE (1800 2665 4483)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render Complaint Modal */}
      {renderComplaintForm()}
    </div>
  );
}