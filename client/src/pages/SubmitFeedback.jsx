import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SuccessModal from "../components/SuccessModal";
import { AuthContext } from "../context/AuthContext";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().default("medium"),
  description: z.string().min(20, "Description must be at least 20 characters long"),
});

export default function SubmitFeedback() {
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { toast } = useToast();
  const { user } = useContext(AuthContext);

  // Set up form with react-hook-form
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      category: "",
      priority: "medium",
      description: ""
    }
  });

  // Fetch categories (could come from API)
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length > 3) {
      toast({
        title: "Too many files",
        description: "Maximum 3 files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size and type
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB limit`,
          variant: "destructive",
        });
      }
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
      }
      
      return isValidSize && isValidType;
    });
    
    setSelectedFiles(validFiles);
    
    // Update file list display
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    validFiles.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'flex items-center justify-between text-sm text-neutral-dark p-2 border border-neutral-light rounded mt-1';
      fileItem.innerHTML = `
        <span>${file.name}</span>
        <button type="button" class="text-neutral-dark hover:text-error">
          <span class="material-icons" style="font-size: 16px;">close</span>
        </button>
      `;
      fileList.appendChild(fileItem);
    });
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Add submitter information
      data.submitter = user ? user.username : 'Guest';
      data.submitterId = user ? user.id : null;
      
      // In a real app, we would upload files here
      
      // Submit feedback data
      await apiRequest('POST', '/api/feedback', data);
      
      // Show success modal
      setIsSuccessModalVisible(true);
      
      // Reset form
      reset();
      setSelectedFiles([]);
      document.getElementById('file-list').innerHTML = '';
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-neutral-darker">Submit Feedback</h2>
        <p className="text-neutral-dark">We value your feedback to improve our services.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="feedback-title" className="block text-sm font-medium text-neutral-darker mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input 
              type="text" 
              id="feedback-title" 
              className={`w-full border ${errors.title ? 'border-error' : 'border-neutral-medium'} rounded px-3 py-2 focus:outline-none focus:border-primary`}
              placeholder="Brief summary of your feedback"
              {...register("title")}
            />
            {errors.title && (
              <div className="text-error text-sm mt-1">{errors.title.message}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="feedback-category" className="block text-sm font-medium text-neutral-darker mb-1">
              Category <span className="text-error">*</span>
            </label>
            <select 
              id="feedback-category" 
              className={`w-full border ${errors.category ? 'border-error' : 'border-neutral-medium'} rounded px-3 py-2 focus:outline-none focus:border-primary`}
              {...register("category")}
            >
              <option value="">Select a category</option>
              {categories?.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
              {!categories && (
                <>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature Request</option>
                  <option value="UI/UX">UI/UX Improvement</option>
                  <option value="Performance">Performance Issue</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
            {errors.category && (
              <div className="text-error text-sm mt-1">{errors.category.message}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="feedback-priority" className="block text-sm font-medium text-neutral-darker mb-1">Priority</label>
            <select 
              id="feedback-priority" 
              className="w-full border border-neutral-medium rounded px-3 py-2 focus:outline-none focus:border-primary"
              {...register("priority")}
            >
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="feedback-description" className="block text-sm font-medium text-neutral-darker mb-1">
              Description <span className="text-error">*</span>
            </label>
            <textarea 
              id="feedback-description" 
              className={`w-full border ${errors.description ? 'border-error' : 'border-neutral-medium'} rounded px-3 py-2 focus:outline-none focus:border-primary h-32`}
              placeholder="Please provide detailed information about your feedback..."
              {...register("description")}
            ></textarea>
            {errors.description && (
              <div className="text-error text-sm mt-1">{errors.description.message}</div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="feedback-attachments" className="block text-sm font-medium text-neutral-darker mb-1">
              Attachments (optional)
            </label>
            <div className="border border-dashed border-neutral-medium rounded p-4 text-center">
              <span className="material-icons text-neutral mb-2">file_upload</span>
              <p className="text-sm text-neutral-dark mb-2">Drag and drop files here or click to browse</p>
              <input 
                type="file" 
                id="feedback-attachments" 
                className="hidden" 
                multiple
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                className="bg-white border border-primary text-primary rounded px-4 py-1 text-sm hover:bg-primary-light"
                onClick={() => document.getElementById('feedback-attachments').click()}
              >
                Browse Files
              </button>
              <p className="text-xs text-neutral-dark mt-2">Maximum 3 files. Supported formats: JPG, PNG, PDF (max 5MB each)</p>
            </div>
            <div id="file-list" className="mt-2"></div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button 
              type="button" 
              className="border border-neutral-medium bg-white text-neutral-darker rounded px-5 py-2 hover:bg-neutral-light"
              onClick={() => {
                reset();
                setSelectedFiles([]);
                document.getElementById('file-list').innerHTML = '';
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              className="bg-primary text-white rounded px-5 py-2 hover:bg-primary-dark"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>

      <SuccessModal 
        isVisible={isSuccessModalVisible} 
        onClose={() => setIsSuccessModalVisible(false)} 
      />
    </section>
  );
}
