export default function SuccessModal({ isVisible, message, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <span className="material-icons text-success">check_circle</span>
          </div>
          <h3 className="text-lg font-medium mt-3">Feedback Submitted!</h3>
          <p className="text-sm text-neutral-dark mt-2">
            {message || "Thank you for your feedback. We have received your submission and will review it shortly."}
          </p>
          <div className="mt-5">
            <button 
              onClick={onClose} 
              className="bg-primary text-white rounded px-4 py-2 w-full hover:bg-primary-dark"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
