import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function FormResponses() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [activeResponseId, setActiveResponseId] = useState(null);

  // Fetch form template
  const { data: formTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: [`/api/forms/${id}`],
    queryFn: () => fetch(`/api/forms/${id}?isAdmin=true&userId=${user?.id}`).then(res => res.json()),
    enabled: !!user && user.isAdmin,
  });

  // Fetch form responses
  const { data: responses, isLoading: isLoadingResponses } = useQuery({
    queryKey: [`/api/forms/${id}/responses`],
    queryFn: () => fetch(`/api/forms/${id}/responses?isAdmin=true&userId=${user?.id}`).then(res => res.json()),
    enabled: !!user && user.isAdmin,
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Export responses to CSV
  const exportToCSV = () => {
    if (!formTemplate || !responses || responses.length === 0) return;
    
    // Get field headers from the template
    const fields = formTemplate.fields;
    const headers = ['Respondent', 'Email', 'Submitted At', ...fields.map(field => field.label)];
    
    // Create rows for each response
    const rows = responses.map(response => {
      const row = [
        response.respondent,
        response.email || '',
        formatDate(response.submittedAt)
      ];
      
      // Add data for each field
      fields.forEach(field => {
        const value = response.responses[field.id];
        if (Array.isArray(value)) {
          row.push(value.join(', '));
        } else {
          row.push(value || '');
        }
      });
      
      return row;
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${formTemplate.title.replace(/\s+/g, '_')}_responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Responses exported",
      description: "Your form responses have been exported to CSV.",
    });
  };

  // Admin check
  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Access Required</h2>
          <p className="text-neutral-dark mb-6 text-center">
            You need administrator privileges to view form responses.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingTemplate || isLoadingResponses) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if form exists
  if (!formTemplate) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Form Not Found</h2>
        <p className="text-neutral-dark mb-6 text-center">
          The form you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <div className="flex justify-center">
          <Link href="/dashboard">
            <button className="bg-primary text-white px-4 py-2 rounded-md">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{formTemplate.title}</h1>
          <p className="text-neutral-dark">
            {responses?.length || 0} responses received
          </p>
        </div>
        <div className="flex items-center">
          <button
            className="mr-3 bg-white border border-neutral-medium text-neutral-dark rounded-md px-4 py-2 flex items-center"
            onClick={() => copyFormLink(formTemplate.accessHash)}
          >
            <span className="material-icons mr-1" style={{ fontSize: "18px" }}>link</span>
            Copy Form Link
          </button>
          <Link href={`/forms/${id}/edit`}>
            <button className="mr-3 bg-white border border-neutral-medium text-neutral-dark rounded-md px-4 py-2 flex items-center">
              <span className="material-icons mr-1" style={{ fontSize: "18px" }}>edit</span>
              Edit Form
            </button>
          </Link>
          <button
            className="bg-primary text-white rounded-md px-4 py-2 flex items-center"
            onClick={exportToCSV}
            disabled={!responses || responses.length === 0}
          >
            <span className="material-icons mr-1" style={{ fontSize: "18px" }}>download</span>
            Export to CSV
          </button>
        </div>
      </div>

      {responses?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Responses list */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-neutral-light">
              <h3 className="text-lg font-medium">Responses</h3>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
              {responses.map((response) => (
                <div
                  key={response.id}
                  className={`p-4 border-b border-neutral-light cursor-pointer hover:bg-neutral-light ${activeResponseId === response.id ? 'bg-neutral-light border-l-4 border-primary' : ''}`}
                  onClick={() => setActiveResponseId(response.id)}
                >
                  <div className="font-medium mb-1">{response.respondent}</div>
                  {response.email && (
                    <div className="text-sm text-neutral-dark mb-1">{response.email}</div>
                  )}
                  <div className="text-xs text-neutral-dark">
                    Submitted: {formatDate(response.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response details */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md">
            {activeResponseId ? (
              <div>
                <div className="p-4 border-b border-neutral-light">
                  <h3 className="text-lg font-medium">Response Details</h3>
                </div>
                <div className="p-6">
                  {formTemplate.fields.map((field) => {
                    const activeResponse = responses.find(r => r.id === activeResponseId);
                    const responseValue = activeResponse?.responses[field.id];
                    
                    return (
                      <div key={field.id} className="mb-6">
                        <h4 className="text-sm font-medium mb-1">{field.label}</h4>
                        <div className="bg-neutral-light p-3 rounded-md">
                          {field.type === 'checkbox' && Array.isArray(responseValue) ? (
                            <ul className="list-disc list-inside">
                              {responseValue.map((value, i) => (
                                <li key={i} className="text-neutral-dark">{value}</li>
                              ))}
                            </ul>
                          ) : responseValue ? (
                            <p className="text-neutral-darker">
                              {responseValue}
                            </p>
                          ) : (
                            <p className="text-neutral-dark italic">No response</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <span className="material-icons text-neutral-dark text-4xl mb-4">visibility</span>
                <p className="text-neutral-dark">Select a response to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <span className="material-icons text-neutral-dark text-5xl">inbox</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
          <p className="text-neutral-dark mb-6">
            Share your form link to start collecting responses
          </p>
          <button
            className="bg-primary text-white rounded-md px-4 py-2 flex items-center mx-auto"
            onClick={() => copyFormLink(formTemplate.accessHash)}
          >
            <span className="material-icons mr-1" style={{ fontSize: "18px" }}>link</span>
            Copy Form Link
          </button>
        </div>
      )}
    </div>
  );
}