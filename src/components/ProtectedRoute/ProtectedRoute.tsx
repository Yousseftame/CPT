// src/components/ProtectedRoute/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext/AuthContext";
import { useEffect, useState } from "react";
import FullScreenLoader from "../shared/FullScreenLoader";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../service/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "superAdmin")[];
}

const ProtectedRoute = ({
  children,
  allowedRoles = ["admin", "superAdmin"],
}: ProtectedRouteProps) => {
  const { user, loading, role } = useAuth();
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.uid || loading) {
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          const status = adminDoc.data().status;
          setAdminStatus(status);
        } else {
          setAdminStatus(null);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setAdminStatus(null);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAdminStatus();
  }, [user, loading]);

  // Still checking auth or status
  if (loading || checkingStatus) {
    return <FullScreenLoader />;
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Email not verified
  if (!user.emailVerified) {
    return <Navigate to="/verify-account" replace />;
  }

  // Admin account is inactive
  if (adminStatus === "inactive") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Not admin/superAdmin or role doesn't match allowedRoles
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
};

export default ProtectedRoute;