import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function LandingPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    isAdmin: false,
  });
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials) => apiRequest("POST", "/api/login", credentials),
    onSuccess: (data) => {
      toast({
        title: "Login successful!",
        description: `Welcome back!`,
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => apiRequest("POST", "/api/register", userData),
    onSuccess: (data) => {
      toast({
        title: "Registration successful!",
        description: "Your account has been created.",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  });
  
  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLoginMode) {
      // Login
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      // Register
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure your passwords match",
          variant: "destructive",
        });
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
      
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        isAdmin: formData.isAdmin,
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-12 md:py-24 max-w-7xl mx-auto">
        {/* Left side (Text content) */}
        <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Create and Share <span className="text-primary">Feedback Forms</span> with Ease
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Build custom feedback forms, collect responses, and analyze data - all in one platform.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate("/public/forms/123456789abcdef0")}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition"
            >
              <span className="flex items-center">
                <span className="material-icons mr-2">visibility</span>
                View Sample Form
              </span>
            </button>
          </div>
        </div>
        
        {/* Right side (Auth form) */}
        <div className="w-full md:w-5/12 bg-white p-8 rounded-lg shadow-lg">
          <div className="flex justify-between mb-8">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`text-lg font-medium py-2 px-4 ${isLoginMode ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`text-lg font-medium py-2 px-4 ${!isLoginMode ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
              Sign Up
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="Enter your password"
                required
              />
            </div>
            
            {!isLoginMode && (
              <>
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <div className="mb-6 flex items-center">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isAdmin" className="text-sm text-gray-700">
                    Register as an admin (can create and manage forms)
                  </label>
                </div>
              </>
            )}
            
            <button
              type="submit"
              className="w-full bg-primary text-white p-3 rounded-md hover:bg-primary/90 transition"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {loginMutation.isPending || registerMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  {isLoginMode ? "Logging in..." : "Creating account..."}
                </span>
              ) : (
                isLoginMode ? "Login" : "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Powerful Features for Form Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <span className="material-icons text-primary text-4xl mb-4">design_services</span>
              <h3 className="text-xl font-semibold mb-2">Form Builder</h3>
              <p className="text-gray-700">
                Create custom forms with various field types including text, multiple choice, checkboxes, and more.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <span className="material-icons text-primary text-4xl mb-4">share</span>
              <h3 className="text-xl font-semibold mb-2">Shareable Links</h3>
              <p className="text-gray-700">
                Generate public links to your forms that can be shared with anyone, no login required.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <span className="material-icons text-primary text-4xl mb-4">analytics</span>
              <h3 className="text-xl font-semibold mb-2">Response Analytics</h3>
              <p className="text-gray-700">
                View and analyze form responses with detailed reports and response visualization.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="mb-4">© 2023 Form Builder. All rights reserved.</p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}