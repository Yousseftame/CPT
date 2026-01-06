import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
} from "@mui/material";
import {
  Search,
  Filter,
  X,
  Eye,
  Package,
  Phone,
  Calendar,
  User,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PagesLoader from "../../../components/shared/PagesLoader";
import { useRequest } from "../../../store/MasterContext/RequestContext";

// Purple & Blue Color Palette
const colors = {
  primary: "#5E35B1",
  primaryLight: "#7E57C2",
  secondary: "#1E88E5",
  secondaryLight: "#42A5F5",
  accent: "#FFB74D",
  success: "#66BB6A",
  error: "#EF5350",
  lightBg: "#F5F5F5",
  cardBg: "#FFFFFF",
  textPrimary: "#263238",
  textSecondary: "#607D8B",
  border: "#E0E0E0",
  lavender: "#EDE7F6",
};

export default function PurchaseRequests() {
  const { requests, loading, fetchRequests, updateRequestStatus } = useRequest();
  const [filteredRequests, setFilteredRequests] = useState(requests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.customerPhone.includes(searchTerm) ||
          req.modelId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return { bgcolor: colors.lavender, color: colors.primary };
      case "in_review":
        return { bgcolor: "#FFF3E0", color: colors.accent };
      case "contacted":
        return { bgcolor: "#E3F2FD", color: colors.secondary };
      case "approved":
        return { bgcolor: "#E8F5E9", color: colors.success };
      case "rejected":
        return { bgcolor: "#FFEBEE", color: colors.error };
      case "completed":
        return { bgcolor: "#ECEFF1", color: colors.textSecondary };
      default:
        return { bgcolor: "#ECEFF1", color: colors.textSecondary };
    }
  };

  const getStats = () => {
    return {
      total: requests.length,
      new: requests.filter((r) => r.status === "new").length,
      in_review: requests.filter((r) => r.status === "in_review").length,
      contacted: requests.filter((r) => r.status === "contacted").length,
      approved: requests.filter((r) => r.status === "approved").length,
      completed: requests.filter((r) => r.status === "completed").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    };
  };

  const stats = getStats();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return <PagesLoader text="Loading purchase requests..." />;
  }

  return (
    <Box sx={{ maxWidth: 1900, mx: "auto", p: { xs: 2, md: 3 }, bgcolor: colors.lightBg, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 style={{ color: colors.primary }} className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart size={32} />
              Purchase Requests
            </h1>
            <p style={{ color: colors.textSecondary }} className="mt-1">
              Manage customer purchase requests and orders
            </p>
          </div>
        </div>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        {/* First Row - Total and New */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            mb: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              color: "white",
              boxShadow: "0 4px 20px rgba(94, 53, 177, 0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Requests</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <ShoppingCart size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 100%)`,
              color: "white",
              boxShadow: "0 4px 20px rgba(30, 136, 229, 0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">New Requests</p>
                <p className="text-3xl font-bold mt-1">{stats.new}</p>
              </div>
              <AlertCircle size={40} className="opacity-75" />
            </div>
          </Paper>
        </Box>

        {/* Second Row - Status Cards */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { 
              xs: "1fr", 
              sm: "repeat(2, 1fr)", 
              lg: "repeat(5, 1fr)" 
            },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#FFF3E0",
              color: colors.accent,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">In Review</p>
                <p className="text-3xl font-bold mt-1">{stats.in_review}</p>
              </div>
              <Clock size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#E3F2FD",
              color: colors.secondary,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Contacted</p>
                <p className="text-3xl font-bold mt-1">{stats.contacted}</p>
              </div>
              <Phone size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#E8F5E9",
              color: colors.success,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Approved</p>
                <p className="text-3xl font-bold mt-1">{stats.approved}</p>
              </div>
              <CheckCircle2 size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#ECEFF1",
              color: colors.textSecondary,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-3xl font-bold mt-1">{stats.completed}</p>
              </div>
              <Package size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "#FFEBEE",
              color: colors.error,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Rejected</p>
                <p className="text-3xl font-bold mt-1">{stats.rejected}</p>
              </div>
              <XCircle size={40} className="opacity-75" />
            </div>
          </Paper>
        </Box>
      </Box>

      {/* Filters Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: colors.cardBg,
        }}
      >
        <div className="flex flex-col md:flex-row gap-3">
          <TextField
            placeholder="Search by customer name, phone, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} style={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: colors.border,
                },
                "&:hover fieldset": {
                  borderColor: colors.primary,
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.primary,
                },
              },
            }}
          />

          <div className="flex items-center gap-2">
            <Filter size={20} style={{ color: colors.textSecondary }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="contacted">Contacted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
          <span className="font-bold">{filteredRequests.length}</span>
          <span>requests found</span>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              size="small"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              sx={{ textTransform: "none", ml: 1, color: colors.primary }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Paper>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: colors.cardBg,
          }}
        >
          <Package size={64} className="mx-auto mb-4" style={{ color: colors.border }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No requests found
          </h3>
          <p style={{ color: colors.textSecondary }}>
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "No purchase requests have been submitted yet"}
          </p>
        </Paper>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const statusStyle = getStatusColor(request.status);

            return (
              <Paper
                key={request.id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: colors.cardBg,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 20px rgba(94, 53, 177, 0.15)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    <Avatar
                      sx={{
                        bgcolor: colors.primary,
                        width: 48,
                        height: 48,
                        fontSize: "1.2rem",
                      }}
                    >
                      {request.customerName.charAt(0).toUpperCase()}
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                            <User size={18} className="inline mr-2" style={{ color: colors.textSecondary }} />
                            {request.customerName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm" style={{ color: colors.textSecondary }}>
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {request.customerPhone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(request.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 items-center mt-3">
                        <Chip
                          icon={<Package size={14} />}
                          label={`${request.requestedUnits} Unit${request.requestedUnits > 1 ? "s" : ""}`}
                          size="small"
                          sx={{ bgcolor: colors.lavender, color: colors.primary, fontWeight: 600 }}
                        />
                        <Chip
                          label={`Model: ${request.modelId}`}
                          size="small"
                          sx={{ bgcolor: "#E3F2FD", color: colors.secondary, fontWeight: 600 }}
                        />
                        {request.assignedUnits && request.assignedUnits.length > 0 && (
                          <Chip
                            icon={<CheckCircle2 size={14} />}
                            label={`${request.assignedUnits.length} Assigned`}
                            size="small"
                            sx={{ bgcolor: "#E8F5E9", color: colors.success, fontWeight: 600 }}
                          />
                        )}
                        {request.internalNotes && request.internalNotes.length > 0 && (
                          <Chip
                            icon={<MessageSquare size={14} />}
                            label={`${request.internalNotes.length} Note${request.internalNotes.length > 1 ? "s" : ""}`}
                            size="small"
                            sx={{ bgcolor: "#FFF3E0", color: colors.accent, fontWeight: 600 }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start ml-4">
                    <select
                      value={request.status}
                      onChange={(e) => updateRequestStatus(request.id, e.target.value as any)}
                      style={{
                        backgroundColor: statusStyle.bgcolor,
                        color: statusStyle.color,
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <option value="new">New</option>
                      <option value="in_review">In Review</option>
                      <option value="contacted">Contacted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Eye size={16} />}
                      onClick={() => navigate(`/requests/${request.id}`)}
                      sx={{
                        textTransform: "none",
                        bgcolor: colors.primary,
                        "&:hover": { bgcolor: colors.primaryLight },
                        px: 3,
                        py : 1,
                        boxShadow: "0 2px 8px rgba(94, 53, 177, 0.3)",
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Paper>
            );
          })}
        </div>
      )}
    </Box>
  );
}