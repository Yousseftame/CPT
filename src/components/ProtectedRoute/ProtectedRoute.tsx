import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext/AuthContext";
import { useEffect, useState } from "react";
import FullScreenLoader from "../shared/FullScreenLoader";
// import { auth } from "../../service/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "superAdmin")[];
}




const ProtectedRoute = ({
  children,
  allowedRoles = ["admin", "superAdmin"],
}: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();

  // 1️⃣ Still checking auth
  if (loading) {
    return <FullScreenLoader />;
  }

  // 2️⃣ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ Email not verified
  if (!user.emailVerified) {
    return <Navigate to="/verify-account" replace />;
  }

  // 4️⃣ Logged in BUT not admin/superAdmin
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5️⃣ Authorized
  return <>{children}</>;
};

export default ProtectedRoute;



