import { Link, useLocation } from "wouter";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = user && user.isAdmin;

  return (
    <aside id="sidebar" className="bg-white shadow-lg w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 -translate-x-full absolute lg:relative z-10 h-full">
      <nav className="p-4 h-full">
        <div className="mb-6">
          <p className="text-primary text-xl font-medium mb-4 text-center">Form Builder</p>
          <div className="border-b border-neutral-light mb-4"></div>
        </div>
        
        {isAdmin && (
          <div>
            <p className="text-neutral-dark text-sm uppercase font-medium mb-2">Forms</p>
            <ul>
              <li className="mb-1">
                <Link href="/dashboard">
                  <div className={`flex items-center p-2 rounded hover:bg-neutral-light ${(location === '/dashboard' || location === '/') ? 'bg-neutral-light text-primary' : ''}`}>
                    <span className="material-icons mr-3">dashboard</span>
                    My Forms
                  </div>
                </Link>
              </li>
              <li className="mb-1">
                <Link href="/forms/new">
                  <div className={`flex items-center p-2 rounded hover:bg-neutral-light ${location === '/forms/new' ? 'bg-neutral-light text-primary' : ''}`}>
                    <span className="material-icons mr-3">add_circle</span>
                    Create New Form
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <div className="border-b border-neutral-light my-2"></div>
              </li>
              <li className="mb-1">
                <Link href="/dashboard">
                  <div className={`flex items-center p-2 rounded hover:bg-neutral-light`}>
                    <span className="material-icons mr-3">help</span>
                    Help & Support
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        )}
        
        {!isAdmin && (
          <div>
            <p className="text-center text-neutral-dark">
              Please log in as an admin to use the form builder.
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}
