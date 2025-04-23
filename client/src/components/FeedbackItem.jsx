import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackItem({ feedback, onStatusChange, isAdmin = false }) {
  const [status, setStatus] = useState(feedback.status);
  const { toast } = useToast();

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  // Define CSS classes based on status
  const statusClasses = {
    "new": "status-new",
    "in-progress": "status-in-progress",
    "resolved": "status-resolved"
  };

  // Define badge colors based on priority
  const priorityBadges = {
    "high": "bg-red-100 text-red-800",
    "medium": "bg-yellow-100 text-yellow-800",
    "low": "bg-green-100 text-green-800"
  };

  // Define badge colors based on status
  const statusBadges = {
    "new": "bg-blue-100 text-blue-800",
    "in-progress": "bg-orange-100 text-orange-800",
    "resolved": "bg-green-100 text-green-800"
  };

  // Handle status change
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    
    try {
      await apiRequest('PATCH', `/api/feedback/${feedback.id}/status`, { status: newStatus });
      if (onStatusChange) {
        onStatusChange(feedback.id, newStatus);
      }
      toast({
        title: "Status updated",
        description: `Feedback status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback status",
        variant: "destructive",
      });
      // Revert the state if the API call fails
      setStatus(feedback.status);
    }
  };

  const handleEdit = () => {
    // This would typically open a modal dialog
    toast({
      title: "Edit feedback",
      description: "Editing functionality would open a modal here",
    });
  };

  return (
    <div className={`p-4 ${statusClasses[status]}`}>
      <div className="flex justify-between">
        <h4 className="font-medium mb-2">{feedback.title}</h4>
        <div className="flex gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadges[feedback.priority]}`}>
            {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadges[status]}`}>
            {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
      <p className="text-sm text-neutral-dark mb-2">{feedback.description}</p>
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <span className="material-icons mr-1 text-neutral" style={{ fontSize: "16px" }}>person</span>
            <span>{feedback.submitter}</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons mr-1 text-neutral" style={{ fontSize: "16px" }}>category</span>
            <span>{feedback.category}</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons mr-1 text-neutral" style={{ fontSize: "16px" }}>schedule</span>
            <span>{formatDate(feedback.createdAt)}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <select
              className="border border-neutral-medium rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
              value={status}
              onChange={handleStatusChange}
            >
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <button 
              className="p-1 text-neutral-dark hover:text-primary"
              onClick={handleEdit}
            >
              <span className="material-icons">edit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
