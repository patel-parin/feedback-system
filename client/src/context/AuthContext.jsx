import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // For demo purposes, auto-login as admin if no user is found
    if (!savedUser) {
      const demoUser = { id: 1, username: 'admin', isAdmin: true };
      setUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // In a real app, we would make an API call here
      // For now we'll simulate it
      if (username === 'admin' && password === 'admin123') {
        const user = { id: 1, username, isAdmin: true };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
