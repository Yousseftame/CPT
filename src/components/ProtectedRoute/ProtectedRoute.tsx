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

  // Check admin status from Firestore
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

  // 1️⃣ Still checking auth or status
  if (loading || checkingStatus) {
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

  // 4️⃣ Admin account is inactive
  if (adminStatus === "inactive") {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5️⃣ Logged in BUT not admin/superAdmin
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 6️⃣ Authorized
  return <>{children}</>;
};

export default ProtectedRoute;