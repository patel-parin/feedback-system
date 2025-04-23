import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import FeedbackItem from "../components/FeedbackItem";
import { AuthContext } from "../context/AuthContext";

export default function MyFeedback() {
  const { user } = useContext(AuthContext);
  
  // Fetch user's feedback
  const { data: feedbackItems, isLoading } = useQuery({
    queryKey: [`/api/feedback/user/${user?.username || 'guest'}`],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-darker">My Feedback</h2>
        <Link href="/submit-feedback">
          <a className="bg-primary text-white rounded px-4 py-2 flex items-center text-sm hover:bg-primary-dark">
            <span className="material-icons mr-2" style={{ fontSize: "18px" }}>add</span>
            New Feedback
          </a>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-neutral-light">
          <h3 className="text-lg font-medium">Your Submitted Feedback</h3>
        </div>
        
        <div className="divide-y divide-neutral-light">
          {feedbackItems && feedbackItems.length > 0 ? (
            feedbackItems.map((item) => (
              <FeedbackItem 
                key={item.id} 
                feedback={item}
                isAdmin={false}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="mb-4">
                <span className="material-icons text-neutral-dark text-5xl">feedback</span>
              </div>
              <h4 className="text-lg font-medium mb-2">No feedback submitted yet</h4>
              <p className="text-neutral-dark mb-4">Share your thoughts and help us improve our services</p>
              <Link href="/submit-feedback">
                <a className="bg-primary text-white rounded px-4 py-2 inline-flex items-center text-sm hover:bg-primary-dark">
                  Submit Your First Feedback
                </a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
