import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  // If no token exists, immediately redirect to Login
  // 'replace' prevents them from hitting Back button to return here
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the requested page (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
