import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./header.css";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const readUser = () => {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? (JSON.parse(raw) as AuthUser) : null);
      } catch {
        setUser(null);
      }
    };
    readUser();
    window.addEventListener("storage", readUser);
    window.addEventListener("auth-changed", readUser);
    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("auth-changed", readUser);
    };
  }, []);

  const name = user?.username?.trim() || "Guest";
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated"); 
    
    window.dispatchEvent(new Event("auth-changed"));
    
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="container header__inner">
        <div className="header__avatar">{initial}</div>
        <div className="header__username">{name}</div>

        <button
          className="header__logout"
          onClick={handleLogout}
          disabled={!user}
          title={user ? "Logout" : "You are not logged in"}
        >
          Logout
        </button>
      </div>
    </header>
  );
}