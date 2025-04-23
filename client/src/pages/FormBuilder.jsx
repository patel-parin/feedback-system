import { useState, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { v4 as uuidv4 } from "uuid";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Field type options
const FIELD_TYPES = [
  { value: "text", label: "Text", icon: "text_fields" },
  { value: "textarea", label: "Paragraph", icon: "notes" },
  { value: "email", label: "Email", icon: "email" },
  { value: "select", label: "Dropdown", icon: "arrow_drop_down_circle" },
  { value: "radio", label: "Multiple Choice", icon: "radio_button_checked" },
  { value: "checkbox", label: "Checkboxes", icon: "check_box" },
];

export default function FormBuilder() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [activeFieldIndex, setActiveFieldIndex] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fetch form data if in edit mode
  const { data: formData, isLoading: isLoadingForm } = useQuery({
    queryKey: [`/api/forms/${id}`],
    queryFn: () => fetch(`/api/forms/${id}?isAdmin=true&userId=${user?.id}`).then(res => res.json()),
    enabled: isEditMode && !!user && user.isAdmin,
  });

  // Load form data when available
  useEffect(() => {
    if (formData) {
      setFormTitle(formData.title);
      setFormDescription(formData.description);
      setFields(formData.fields);
    }
  }, [formData]);

  // Create new form mutation
  const createFormMutation = useMutation({
    mutationFn: (formData) => apiRequest("POST", "/api/forms?isAdmin=true", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Form created!",
        description: "Your form has been created successfully.",
      });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create the form. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: (formData) => apiRequest("PUT", `/api/forms/${id}?isAdmin=true`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${id}`] });
      toast({
        title: "Form updated!",
        description: "Your form has been updated successfully.",
      });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the form. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add new field to the form
  const addField = (type) => {
    const newField = {
      id: uuidv4(),
      label: `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      required: false,
      placeholder: "",
      options: type === "select" || type === "radio" || type === "checkbox" ? ["Option 1", "Option 2", "Option 3"] : undefined,
    };
    
    setFields([...fields, newField]);
    setActiveFieldIndex(fields.length);
  };

  // Update field property
  const updateField = (index, property, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [property]: value };
    setFields(updatedFields);
  };

  // Add option to a field (for select, radio, checkbox)
  const addOption = (index) => {
    const updatedFields = [...fields];
    const field = updatedFields[index];
    
    if (field && field.options) {
      field.options = [...field.options, `Option ${field.options.length + 1}`];
      setFields(updatedFields);
    }
  };

  // Update option for a field
  const updateOption = (fieldIndex, optionIndex, value) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options[optionIndex] = value;
    setFields(updatedFields);
  };

  // Remove option from a field
  const removeOption = (fieldIndex, optionIndex) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFields(updatedFields);
  };

  // Delete field
  const deleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
    setActiveFieldIndex(null);
  };

  // Move field up
  const moveFieldUp = (index) => {
    if (index === 0) return;
    const updatedFields = [...fields];
    [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
    setFields(updatedFields);
    setActiveFieldIndex(index - 1);
  };

  // Move field down
  const moveFieldDown = (index) => {
    if (index === fields.length - 1) return;
    const updatedFields = [...fields];
    [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
    setFields(updatedFields);
    setActiveFieldIndex(index + 1);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formTitle.trim()) {
      toast({
        title: "Form title required",
        description: "Please provide a title for your form.",
        variant: "destructive",
      });
      return;
    }
    
    if (fields.length === 0) {
      toast({
        title: "No fields added",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = {
      title: formTitle,
      description: formDescription,
      fields,
    };
    
    if (isEditMode) {
      updateFormMutation.mutate(formData);
    } else {
      createFormMutation.mutate(formData);
    }
  };

  // Admin check
  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Access Required</h2>
          <p className="text-neutral-dark mb-6 text-center">
            You need administrator privileges to create or edit forms.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isEditMode && isLoadingForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditMode ? "Edit Form" : "Create New Form"}</h1>
        <div className="flex items-center">
          <button
            type="button"
            className={`mr-3 px-4 py-2 rounded-md ${isPreviewMode ? "bg-primary text-white" : "bg-white border border-neutral-medium text-neutral-dark"}`}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <span className="flex items-center">
              <span className="material-icons mr-1" style={{ fontSize: "18px" }}>{isPreviewMode ? "edit" : "visibility"}</span>
              {isPreviewMode ? "Edit" : "Preview"}
            </span>
          </button>
          <button
            type="button"
            className="bg-primary text-white px-4 py-2 rounded-md"
            onClick={handleSubmit}
            disabled={createFormMutation.isPending || updateFormMutation.isPending}
          >
            {(createFormMutation.isPending || updateFormMutation.isPending) ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="material-icons mr-1" style={{ fontSize: "18px" }}>save</span>
                Save Form
              </span>
            )}
          </button>
        </div>
      </div>

      {!isPreviewMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form builder panel */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Form Title"
                className="w-full text-2xl font-bold border-none focus:outline-none focus:ring-0 mb-2"
              />
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Form Description (optional)"
                className="w-full text-neutral-dark border-none focus:outline-none focus:ring-0 resize-none"
                rows={2}
              />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className={`bg-white rounded-lg shadow-md p-6 relative ${index === activeFieldIndex ? 'border-2 border-primary' : ''}`}
                  onClick={() => setActiveFieldIndex(index)}
                >
                  <div className="mb-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, "label", e.target.value)}
                      placeholder="Field Label"
                      className="w-full text-lg font-medium border-none focus:outline-none focus:ring-0"
                    />
                  </div>

                  {/* Render different field types */}
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || "Text input"}
                      className="w-full p-2 border border-neutral-light rounded-md"
                      disabled
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      placeholder={field.placeholder || "Paragraph text"}
                      className="w-full p-2 border border-neutral-light rounded-md"
                      rows={3}
                      disabled
                    ></textarea>
                  )}

                  {field.type === "email" && (
                    <input
                      type="email"
                      placeholder={field.placeholder || "Email address"}
                      className="w-full p-2 border border-neutral-light rounded-md"
                      disabled
                    />
                  )}

                  {field.type === "select" && (
                    <select className="w-full p-2 border border-neutral-light rounded-md" disabled>
                      {field.options?.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {field.type === "radio" && (
                    <div className="space-y-2">
                      {field.options?.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="radio" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {field.type === "checkbox" && (
                    <div className="space-y-2">
                      {field.options?.map((option, i) => (
                        <div key={i} className="flex items-center">
                          <input type="checkbox" disabled className="mr-2" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Field actions */}
                  <div className="absolute top-2 right-2 flex">
                    <button
                      type="button"
                      className="p-1 text-neutral-dark hover:text-primary"
                      onClick={() => moveFieldUp(index)}
                      disabled={index === 0}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-neutral-dark hover:text-primary"
                      onClick={() => moveFieldDown(index)}
                      disabled={index === fields.length - 1}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-neutral-dark hover:text-error"
                      onClick={() => deleteField(index)}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>delete</span>
                    </button>
                  </div>

                  {/* Required checkbox */}
                  <div className="mt-3 flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) => updateField(index, "required", e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`required-${field.id}`} className="text-sm text-neutral-dark">Required field</label>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="mb-4">
                    <span className="material-icons text-neutral-dark text-5xl">add_circle_outline</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No fields added yet</h3>
                  <p className="text-neutral-dark mb-4">Add fields from the panel on the right</p>
                </div>
              )}
            </div>
          </div>

          {/* Field properties panel */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Add Field</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className="bg-white border border-neutral-light hover:border-primary rounded-md p-3 flex flex-col items-center"
                    onClick={() => addField(type.value)}
                  >
                    <span className="material-icons text-primary mb-1">{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>

              {activeFieldIndex !== null && fields[activeFieldIndex] && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Field Properties</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-dark mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={fields[activeFieldIndex].placeholder || ""}
                        onChange={(e) => updateField(activeFieldIndex, "placeholder", e.target.value)}
                        placeholder="Enter placeholder text"
                        className="w-full p-2 border border-neutral-light rounded-md"
                      />
                    </div>

                    {(fields[activeFieldIndex].type === "select" || 
                      fields[activeFieldIndex].type === "radio" || 
                      fields[activeFieldIndex].type === "checkbox") && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-neutral-dark">
                            Options
                          </label>
                          <button
                            type="button"
                            className="text-primary text-sm flex items-center"
                            onClick={() => addOption(activeFieldIndex)}
                          >
                            <span className="material-icons mr-1" style={{ fontSize: "16px" }}>add</span>
                            Add Option
                          </button>
                        </div>
                        {fields[activeFieldIndex].options?.map((option, i) => (
                          <div key={i} className="flex items-center mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(activeFieldIndex, i, e.target.value)}
                              className="flex-1 p-2 border border-neutral-light rounded-md mr-2"
                            />
                            <button
                              type="button"
                              className="text-neutral-dark hover:text-error"
                              onClick={() => removeOption(activeFieldIndex, i)}
                              disabled={fields[activeFieldIndex].options.length <= 1}
                            >
                              <span className="material-icons" style={{ fontSize: "18px" }}>remove_circle_outline</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Preview mode
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{formTitle || "Untitled Form"}</h2>
            {formDescription && <p className="text-neutral-dark">{formDescription}</p>}
          </div>

          <form className="space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === "text" && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-neutral-light rounded-md"
                    required={field.required}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-neutral-light rounded-md"
                    rows={3}
                    required={field.required}
                  ></textarea>
                )}

                {field.type === "email" && (
                  <input
                    type="email"
                    placeholder={field.placeholder}
                    className="w-full p-2 border border-neutral-light rounded-md"
                    required={field.required}
                  />
                )}

                {field.type === "select" && (
                  <select 
                    className="w-full p-2 border border-neutral-light rounded-md"
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
                          className="mr-2"
                          required={field.required}
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
                          className="mr-2"
                        />
                        <label htmlFor={`${field.id}-option-${i}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {fields.length > 0 && (
              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-md"
                  onClick={(e) => e.preventDefault()}
                >
                  Submit
                </button>
              </div>
            )}

            {fields.length === 0 && (
              <div className="text-center py-8 text-neutral-dark">
                No fields added to this form yet. Switch to Edit mode to add fields.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}