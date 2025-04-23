import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FeedbackItem from "../components/FeedbackItem";
import { useToast } from "@/hooks/use-toast";

export default function AllFeedback() {
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all feedback
  const { data: feedbackItems, isLoading } = useQuery({
    queryKey: ['/api/feedback'],
  });

  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
  };

  // Filter feedback items
  const filteredFeedback = feedbackItems ? feedbackItems.filter(item => {
    // Apply status filter
    if (statusFilter && item.status !== statusFilter) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }
    
    // Apply priority filter
    if (priorityFilter && item.priority !== priorityFilter) {
      return false;
    }
    
    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      const itemDate = new Date(item.createdAt);
      
      if (dateFilter === 'today') {
        return itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return itemDate >= thirtyDaysAgo;
      }
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) || 
             item.description.toLowerCase().includes(query);
    }
    
    return true;
  }) : [];

  // Sort feedback items
  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortBy === 'priority-desc') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    } else if (sortBy === 'priority-asc') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedFeedback.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedFeedback.length);
  const currentItems = sortedFeedback.slice(startIndex, endIndex);

  // Handle apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    toast({
      title: "Filters applied",
      description: "The feedback list has been filtered according to your criteria",
    });
  };

  // Handle export data
  const handleExportData = () => {
    toast({
      title: "Export initiated",
      description: "Your data is being prepared for export",
    });
  };

  // Handle refresh data
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
    toast({
      title: "Data refreshed",
      description: "The feedback list has been updated",
    });
  };

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
        <h2 className="text-2xl font-medium text-neutral-darker">All Feedback</h2>
        <div className="flex gap-2">
          <button 
            className="bg-white border border-neutral-medium rounded px-4 py-2 flex items-center text-sm"
            onClick={handleExportData}
          >
            <span className="material-icons mr-2 text-neutral-dark" style={{ fontSize: "18px" }}>file_download</span>
            Export
          </button>
          <button 
            className="bg-primary text-white rounded px-4 py-2 flex items-center text-sm hover:bg-primary-dark"
            onClick={handleRefreshData}
          >
            <span className="material-icons mr-2" style={{ fontSize: "18px" }}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-dark mb-1">Status</label>
              <select 
                id="status-filter" 
                className="w-full border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-neutral-dark mb-1">Category</label>
              <select 
                id="category-filter" 
                className="w-full border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
                <option value="UI/UX">UI/UX</option>
                <option value="Performance">Performance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority-filter" className="block text-sm font-medium text-neutral-dark mb-1">Priority</label>
              <select 
                id="priority-filter" 
                className="w-full border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-filter" className="block text-sm font-medium text-neutral-dark mb-1">Date Range</label>
              <select 
                id="date-filter" 
                className="w-full border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-light flex justify-between items-center">
            <div className="flex items-center">
              <label htmlFor="search" className="block text-sm font-medium text-neutral-dark mr-2">Search:</label>
              <input 
                type="text" 
                id="search" 
                className="border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary w-64" 
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="bg-primary text-white rounded px-4 py-2 text-sm hover:bg-primary-dark"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-neutral-light flex justify-between items-center">
          <h3 className="text-lg font-medium">Feedback Items</h3>
          <div className="flex items-center">
            <label htmlFor="sort-by" className="block text-sm font-medium text-neutral-dark mr-2">Sort by:</label>
            <select 
              id="sort-by" 
              className="border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="priority-desc">Highest Priority</option>
              <option value="priority-asc">Lowest Priority</option>
            </select>
          </div>
        </div>
        
        <div className="divide-y divide-neutral-light">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <FeedbackItem 
                key={item.id} 
                feedback={item} 
                onStatusChange={handleStatusChange}
                isAdmin={true}
              />
            ))
          ) : (
            <div className="p-4 text-center text-neutral-dark">
              No feedback items match your criteria
            </div>
          )}
        </div>

        {sortedFeedback.length > 0 && (
          <div className="p-4 border-t border-neutral-light">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-dark">
                Showing {startIndex + 1} to {endIndex} of {sortedFeedback.length} entries
              </div>
              <div className="flex items-center">
                <button 
                  className={`mx-1 px-3 py-1 rounded border ${currentPage === 1 ? 'border-neutral-medium bg-white text-sm opacity-50 cursor-not-allowed' : 'border-neutral-medium bg-white text-sm hover:bg-neutral-light'}`}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    className={`mx-1 px-3 py-1 rounded border ${currentPage === i + 1 ? 'border-primary bg-primary text-white' : 'border-neutral-medium bg-white hover:bg-neutral-light'} text-sm`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className={`mx-1 px-3 py-1 rounded border ${currentPage === totalPages ? 'border-neutral-medium bg-white text-sm opacity-50 cursor-not-allowed' : 'border-neutral-medium bg-white text-sm hover:bg-neutral-light'}`}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
