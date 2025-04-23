import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function FormDashboard() {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  
  // Fetch form templates created by the user
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: () => fetch(`/api/forms?isAdmin=true&userId=${user?.id}`).then(res => res.json()),
    enabled: !!user && user.isAdmin,
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Copy form link to clipboard
  const copyFormLink = (accessHash) => {
    const link = `${window.location.origin}/public/forms/${accessHash}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "The form link has been copied to your clipboard.",
    });
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Access Required</h2>
          <p className="text-neutral-dark mb-6 text-center">
            You need administrator privileges to access the form builder.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Forms</h1>
        <Link href="/forms/new">
          <button className="bg-primary text-white px-4 py-2 rounded-md flex items-center">
            <span className="material-icons mr-2">add</span>
            Create New Form
          </button>
        </Link>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-5 border-b border-neutral-light">
                <h3 className="text-lg font-semibold mb-1 truncate">{template.title}</h3>
                <p className="text-sm text-neutral-dark mb-2">
                  Created: {formatDate(template.createdAt)}
                </p>
                <div className="flex items-center text-sm">
                  <span className="flex items-center mr-4">
                    <span className="material-icons text-neutral-dark mr-1" style={{ fontSize: "16px" }}>description</span>
                    {template.fields.length} Fields
                  </span>
                  <span className="flex items-center">
                    <span className="material-icons text-neutral-dark mr-1" style={{ fontSize: "16px" }}>forum</span>
                    0 Responses
                  </span>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="flex">
                  <button 
                    onClick={() => copyFormLink(template.accessHash)}
                    className="text-sm text-primary flex items-center mr-3"
                  >
                    <span className="material-icons mr-1" style={{ fontSize: "16px" }}>link</span>
                    Copy Link
                  </button>
                  <Link href={`/forms/${template.id}/edit`}>
                    <button className="text-sm text-primary flex items-center mr-3">
                      <span className="material-icons mr-1" style={{ fontSize: "16px" }}>edit</span>
                      Edit
                    </button>
                  </Link>
                </div>
                <Link href={`/forms/${template.id}/responses`}>
                  <button className="bg-primary text-white px-3 py-1 rounded text-sm">
                    View Responses
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <span className="material-icons text-neutral-dark text-5xl">description</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No forms created yet</h3>
          <p className="text-neutral-dark mb-6">Create your first form to start collecting responses</p>
          <Link href="/forms/new">
            <button className="bg-primary text-white px-4 py-2 rounded-md">
              Create Your First Form
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}