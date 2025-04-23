import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "wouter";

export default function AppHeader() {
  const { user, logout } = useContext(AuthContext);
  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.remove('-translate-x-full');
    } else {
      sidebar.classList.add('-translate-x-full');
    }
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="mr-4 lg:hidden">
            <span className="material-icons">menu</span>
          </button>
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className="material-icons mr-2">dynamic_form</span>
              <h1 className="text-xl font-medium">Form Builder</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center">
          <span className="material-icons mr-2">account_circle</span>
          <span>{user ? user.username : 'Guest'}</span>
          {user && (
            <button onClick={logout} className="ml-4 p-2 hover:bg-primary-dark rounded">
              <span className="material-icons">logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
