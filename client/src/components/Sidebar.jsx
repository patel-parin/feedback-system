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
        <div className="mb-8">
          <p className="text-neutral-dark text-sm uppercase font-medium mb-2">User</p>
          <ul>
            <li className="mb-1">
              <Link href="/submit-feedback">
                <a className={`flex items-center p-2 rounded hover:bg-neutral-light ${location === '/submit-feedback' ? 'bg-neutral-light text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-primary">add_circle</span>
                  Submit Feedback
                </a>
              </Link>
            </li>
            <li className="mb-1">
              <Link href="/my-feedback">
                <a className={`flex items-center p-2 rounded hover:bg-neutral-light ${location === '/my-feedback' ? 'bg-neutral-light text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-primary">format_list_bulleted</span>
                  My Feedback
                </a>
              </Link>
            </li>
          </ul>
        </div>
        
        {isAdmin && (
          <div>
            <p className="text-neutral-dark text-sm uppercase font-medium mb-2">Admin</p>
            <ul>
              <li className="mb-1">
                <Link href="/dashboard">
                  <a className={`flex items-center p-2 rounded hover:bg-neutral-light ${(location === '/dashboard' || location === '/') ? 'bg-neutral-light text-primary' : ''}`}>
                    <span className="material-icons mr-3">dashboard</span>
                    Dashboard
                  </a>
                </Link>
              </li>
              <li className="mb-1">
                <Link href="/all-feedback">
                  <a className={`flex items-center p-2 rounded hover:bg-neutral-light ${location === '/all-feedback' ? 'bg-neutral-light text-primary' : ''}`}>
                    <span className="material-icons mr-3">inbox</span>
                    All Feedback
                  </a>
                </Link>
              </li>
              <li className="mb-1">
                <a className="flex items-center p-2 rounded hover:bg-neutral-light">
                  <span className="material-icons mr-3">category</span>
                  Categories
                </a>
              </li>
              <li className="mb-1">
                <a className="flex items-center p-2 rounded hover:bg-neutral-light">
                  <span className="material-icons mr-3">settings</span>
                  Settings
                </a>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
