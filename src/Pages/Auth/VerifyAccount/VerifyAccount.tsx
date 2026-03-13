import { useState, useEffect } from "react";
import { MailCheck, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../../service/firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AuthCardWrapper from "../../../components/shared/AuthCardWrapper";
import ErrorAlert from "../../../components/shared/ErrorAlert";
import AuthButton from "../../../components/shared/AuthButton";

const VerifyAccount = () => {
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [error, setError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if email was just sent from registration
    const emailSentAt = sessionStorage.getItem('emailSentAt');
    
    if (emailSentAt) {
      const timeElapsed = Math.floor((Date.now() - parseInt(emailSentAt)) / 1000);
      const remainingSeconds = Math.max(0, 60 - timeElapsed);
      
      if (remainingSeconds > 0) {
        setCooldownSeconds(remainingSeconds);
        setIsDisabled(true);
      }
      
      // Clear the timestamp after using it
      sessionStorage.removeItem('emailSentAt');
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setIsDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [cooldownSeconds]);

  const handleVerifyAccount = async () => {
    if (isDisabled) return;

    setLoading(true);
    setError("");

    try {
      if (!auth.currentUser) {
        setError("Session expired. Please login again to verify your email.");
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      await sendEmailVerification(auth.currentUser);

      toast.success("Verification email sent!", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });

      // Set cooldown after successful send
      setCooldownSeconds(60);
      setIsDisabled(true);

    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a moment before trying again.");
        setCooldownSeconds(60);
        setIsDisabled(true);
      } else {
        setError("Failed to send verification email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setError("");

    try {
      if (!auth.currentUser) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Reload user to get latest emailVerified status
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        toast.success("Email verified successfully!");
        navigate('/dashboard');
      } else {
        toast.error("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (err: any) {
      setError("Failed to check verification status. Please try again.");
    } finally {
      setCheckingVerification(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthCardWrapper
      title="Verify your email"
      subtitle="We need to verify your email address before continuing"
      icon={<MailCheck className="text-white" size={32} />}
    >
      <ErrorAlert message={error} onClose={() => setError("")} />

      {cooldownSeconds > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Clock className="text-blue-600" size={20} />
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-medium">
              Verification email already sent!
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Please wait {formatTime(cooldownSeconds)} before requesting another email
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 text-center mb-6">
        {cooldownSeconds > 0 
          ? "A verification email has been sent to your inbox. Please check your email and click the verification link."
          : "Click the button below and we'll send you a verification email."
        }
      </p>

      <div className="space-y-3">
        <AuthButton
          type="button"
          onClick={handleVerifyAccount}
          loading={loading}
          disabled={isDisabled || loading}
          loadingText="Sending..."
          icon={<ArrowRight size={20} />}
        >
          {cooldownSeconds > 0 ? `Resend in ${formatTime(cooldownSeconds)}` : "Send Verification Email"}
        </AuthButton>

        <button
          type="button"
          onClick={handleCheckVerification}
          disabled={checkingVerification}
          className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={20} className={checkingVerification ? "animate-spin" : ""} />
          {checkingVerification ? "Checking..." : "I've Verified My Email"}
        </button>
      </div>

      <p className="text-center text-sm text-gray-600 mt-10">
        Need to login with a different account?{" "}
        <button
          onClick={() => navigate("/login")}
          type="button"
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
          disabled={loading || checkingVerification}
        >
          Go to Login
        </button>
      </p>
    </AuthCardWrapper>
  );
};

export default VerifyAccount;