import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PublicForm() {
  const { hash } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch form template
  const { data: formTemplate, isLoading, error } = useQuery({
    queryKey: [`/api/public/forms/${hash}`],
    queryFn: () => fetch(`/api/public/forms/${hash}`).then(res => res.json()),
  });

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: (data) => apiRequest("POST", `/api/public/forms/${formTemplate.id}/submit`, data),
    onSuccess: () => {
      toast({
        title: "Form submitted!",
        description: "Your response has been recorded.",
      });
      navigate("/forms/success");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit the form. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  // Handle input change
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error when field is filled
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (fieldId, option, checked) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter(val => val !== option)
        };
      }
    });
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate required fields
    const errors = {};
    if (formTemplate && formTemplate.fields) {
      formTemplate.fields.forEach(field => {
        if (field.required && 
            (!formData[field.id] || 
             (Array.isArray(formData[field.id]) && formData[field.id].length === 0))) {
          errors[field.id] = "This field is required";
        }
      });
    }
    
    // Validate respondent name and email
    if (!formData.respondent || formData.respondent.trim() === "") {
      errors.respondent = "Please provide your name";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please provide a valid email address";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }
    
    // Submit the form
    const submissionData = {
      formId: formTemplate.id,
      respondent: formData.respondent,
      email: formData.email || null,
      responses: formData
    };
    
    submitFormMutation.mutate(submissionData);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error || !formTemplate) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-bold text-center mb-6">Form Not Found</h2>
        <p className="text-neutral-dark mb-6 text-center">
          The form you're looking for doesn't exist or has been deactivated.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-3">{formTemplate.title}</h1>
        {formTemplate.description && (
          <p className="text-neutral-dark mb-6">{formTemplate.description}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Respondent information */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.respondent || ""}
              onChange={(e) => handleInputChange("respondent", e.target.value)}
              className={`w-full p-2 border rounded-md ${validationErrors.respondent ? 'border-red-500' : 'border-neutral-light'}`}
              placeholder="Enter your full name"
            />
            {validationErrors.respondent && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.respondent}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full p-2 border rounded-md ${validationErrors.email ? 'border-red-500' : 'border-neutral-light'}`}
              placeholder="your.email@example.com"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="border-t border-neutral-light my-4 pt-4">
            <h3 className="text-lg font-medium mb-4">Form Fields</h3>
          </div>
          
          {/* Form fields */}
          {formTemplate.fields.map((field) => (
            <div key={field.id} className="mb-6">
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === "text" && (
                <input
                  type="text"
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ""}
                  className={`w-full p-2 border rounded-md ${validationErrors[field.id] ? 'border-red-500' : 'border-neutral-light'}`}
                  required={field.required}
                />
              )}
              
              {field.type === "textarea" && (
                <textarea
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ""}
                  className={`w-full p-2 border rounded-md ${validationErrors[field.id] ? 'border-red-500' : 'border-neutral-light'}`}
                  rows={4}
                  required={field.required}
                ></textarea>
              )}
              
              {field.type === "email" && (
                <input
                  type="email"
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ""}
                  className={`w-full p-2 border rounded-md ${validationErrors[field.id] ? 'border-red-500' : 'border-neutral-light'}`}
                  required={field.required}
                />
              )}
              
              {field.type === "select" && (
                <select
                  value={formData[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={`w-full p-2 border rounded-md ${validationErrors[field.id] ? 'border-red-500' : 'border-neutral-light'}`}
                  required={field.required}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}
              
              {field.type === "radio" && (
                <div className="space-y-2">
                  {field.options?.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type="radio"
                        id={`${field.id}-option-${i}`}
                        name={field.id}
                        value={option}
                        checked={formData[field.id] === option}
                        onChange={() => handleInputChange(field.id, option)}
                        className="mr-2"
                        required={field.required && i === 0}
                      />
                      <label htmlFor={`${field.id}-option-${i}`}>{option}</label>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === "checkbox" && (
                <div className="space-y-2">
                  {field.options?.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${field.id}-option-${i}`}
                        name={`${field.id}[${i}]`}
                        value={option}
                        checked={(formData[field.id] || []).includes(option)}
                        onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`${field.id}-option-${i}`}>{option}</label>
                    </div>
                  ))}
                </div>
              )}
              
              {validationErrors[field.id] && (
                <p className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</p>
              )}
            </div>
          ))}
          
          <div className="pt-4">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-md w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Submitting...
                </span>
              ) : "Submit Response"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}