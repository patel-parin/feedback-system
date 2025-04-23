import { Link } from "wouter";

export default function FormSubmissionSuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="material-icons text-3xl text-green-500">check_circle</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
        
        <p className="text-neutral-dark mb-6">
          Your response has been successfully submitted. We appreciate your time in completing this form.
        </p>
        
        <div className="space-y-3">
          <Link href="/">
            <a className="block w-full bg-primary text-white rounded-md px-6 py-2">
              Return to Home
            </a>
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="block w-full bg-white border border-neutral-medium text-neutral-dark rounded-md px-6 py-2"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}