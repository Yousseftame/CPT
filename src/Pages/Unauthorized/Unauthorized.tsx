import { ShieldOff, ArrowLeft, Lock, AlertTriangle, LogOut, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/AuthContext/AuthContext";
import toast from "react-hot-toast";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      navigate("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Danger orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Warning stripes pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_50px,rgba(239,68,68,0.5)_50px,rgba(239,68,68,0.5)_100px)]"></div>
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Floating warning particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 border border-red-500/30 rotate-45 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Card Container */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-500/20 overflow-hidden">
            {/* Red Alert Bar */}
            <div className="h-2 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse"></div>
            
            <div className="p-8 md:p-12 text-center">
              {/* Animated Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* Rotating ring */}
                  <div className="absolute inset-0 w-28 h-28 border-4 border-red-500/30 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute inset-2 w-24 h-24 border-4 border-orange-500/20 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                  
                  {/* Center icon */}
                  <div className="relative w-28 h-28 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                    <ShieldOff className="text-white" size={52} />
                  </div>
                  
                  {/* Warning badge */}
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    <AlertTriangle className="text-slate-900" size={24} />
                  </div>
                </div>
              </div>

              {/* Error Code */}
              <div className="inline-block mb-4">
                <div className="px-6 py-2 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-full">
                  <span className="text-red-400 font-bold text-lg flex items-center gap-2">
                    <Lock size={18} />
                    ERROR 403
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4">
                Access Denied
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
                You don't have the necessary permissions to access this area. 
                Please contact your administrator if you believe this is an error.
              </p>

              {/* Warning Box */}
              <div className="mb-8 p-6 bg-red-500/10 backdrop-blur-sm border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                  <div className="text-left">
                    <p className="text-red-300 font-semibold mb-1">Restricted Access</p>
                    <p className="text-sm text-gray-400">
                      This page requires special permissions. Your current role does not grant access to this resource.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/20 border border-white/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-600/50 to-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-2 justify-center">
                    <ArrowLeft size={20} />
                    Go Back
                  </div>
                </button>

                {/* <button
                  onClick={() => navigate("/dashboard")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-2 justify-center">
                    <Home size={20} />
                    Dashboard
                  </div>
                </button> */}

                <button
                  onClick={handleLogout}
                  className="group relative px-8 py-4 bg-red-600/20 backdrop-blur-sm text-red-400 font-semibold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-red-600/30 border border-red-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-red-700/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center gap-2 justify-center">
                    <LogOut size={20} />
                    Logout
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Need help? Contact support at{" "}
              <a href="mailto:support@example.com" className="text-purple-400 hover:text-purple-300 transition-colors">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(45deg);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(30px) rotate(45deg);
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default Unauthorized;