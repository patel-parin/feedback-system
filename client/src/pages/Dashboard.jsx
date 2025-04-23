import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import StatusDistributionCard from "../components/StatusDistributionCard";
import { format } from "date-fns";

export default function Dashboard() {
  // Fetch stats data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Fetch recent feedback
  const { data: allFeedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/feedback'],
  });

  // Get 5 most recent feedback items
  const recentFeedback = allFeedback?.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  // Helper to format ISO date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return format(new Date(dateString), "yyyy-MM-dd");
  };

  // Helper to generate an id string
  const formatId = (id) => {
    return `#FB-${1000 + id}`;
  };

  if (statsLoading || feedbackLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-darker">Dashboard</h2>
        <div>
          <button className="bg-white border border-neutral-medium rounded px-4 py-2 flex items-center text-sm">
            <span className="material-icons mr-2 text-neutral-dark" style={{ fontSize: "18px" }}>file_download</span>
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Feedback" 
          value={stats?.total || 0} 
          icon="forum"
        />
        <StatCard 
          title="In Progress" 
          value={stats?.statusDistribution?.inProgress || 0} 
          icon="pending"
        />
        <StatCard 
          title="Resolved" 
          value={stats?.statusDistribution?.resolved || 0} 
          icon="check_circle"
        />
        <StatCard 
          title="High Priority" 
          value={stats?.priorityDistribution?.high || 0} 
          icon="priority_high"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard 
          title="Feedback by Category" 
          data={stats?.categoryDistribution || {}}
        />
        <StatusDistributionCard data={stats} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-neutral-light">
          <h3 className="text-lg font-medium">Recent Feedback</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-light">
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-darker">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-light">
              {recentFeedback && recentFeedback.map(feedback => (
                <tr key={feedback.id} className="hover:bg-neutral-light">
                  <td className="px-4 py-3 text-sm">{formatId(feedback.id)}</td>
                  <td className="px-4 py-3">
                    <a href="#view-feedback" className="text-primary hover:underline">{feedback.title}</a>
                  </td>
                  <td className="px-4 py-3 text-sm">{feedback.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${feedback.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        feedback.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${feedback.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                        feedback.status === 'in-progress' ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {feedback.status === 'in-progress' ? 'In Progress' : 
                        feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-dark">{formatDate(feedback.createdAt)}</td>
                </tr>
              ))}
              {(!recentFeedback || recentFeedback.length === 0) && (
                <tr>
                  <td colSpan="6" className="px-4 py-3 text-center text-sm text-neutral-dark">
                    No feedback available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-neutral-light">
          <Link href="/all-feedback">
            <a className="text-primary hover:underline flex items-center text-sm">
              View all feedback
              <span className="material-icons ml-1" style={{ fontSize: "16px" }}>arrow_forward</span>
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
