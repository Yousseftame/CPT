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
  Switch,
} from "@mui/material";
import {
  Search,
  Filter,
  X,
  Eye,
  Edit,
  UserPlus,
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../../store/MasterContext/AdminContext";
import PagesLoader from "../../../components/shared/PagesLoader";

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

export default function AdminList() {
  const { admins, loading, fetchAdmins, updateAdminStatus } = useAdmin();
  const [filteredAdmins, setFilteredAdmins] = useState(admins);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    let filtered = [...admins];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (admin) =>
          admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((admin) => admin.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((admin) => admin.status === statusFilter);
    }

    setFilteredAdmins(filtered);
  }, [searchTerm, roleFilter, statusFilter, admins]);

  const handleStatusToggle = async (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
   setStatusLoading(prev => ({
    ...prev,
    [adminId]: true,
  }));
    try {
      await updateAdminStatus(adminId, newStatus as "active" | "inactive");
    } catch (error) {
      console.error("Error toggling status:", error);
    }
    finally {
      setStatusLoading(prev => ({
      ...prev,
      [adminId]: false,
    }));
    }
  };

  const getStats = () => {
    return {
      total: admins.length,
      active: admins.filter((a) => a.status === "active").length,
      inactive: admins.filter((a) => a.status === "inactive").length,
      superAdmins: admins.filter((a) => a.role === "superAdmin").length,
      regularAdmins: admins.filter((a) => a.role === "admin").length,
    };
  };

  const stats = getStats();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Never";
    }
  };

  if (loading && admins.length === 0) {
    return <PagesLoader text="Loading admins..." />;
  }

  return (
    <Box sx={{ maxWidth: 1900, mx: "auto", p: { xs: 2, md: 3 }, bgcolor: colors.lightBg, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 style={{ color: colors.primary }} className="text-3xl font-bold flex items-center gap-2">
              <Users size={32} />
              Admin Management
            </h1>
            <p style={{ color: colors.textSecondary }} className="mt-1">
              Manage admin accounts and permissions
            </p>
          </div>
          <Button
            variant="contained"
            startIcon={<UserPlus size={20} />}
            onClick={() => navigate("/admins/create")}
            sx={{
              textTransform: "none",
              bgcolor: colors.primary,
              "&:hover": { bgcolor: colors.primaryLight },
              px: 4,
              py: 1.5,
              boxShadow: "0 4px 12px rgba(94, 53, 177, 0.3)",
            }}
          >
            Add New Admin
          </Button>
        </div>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
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
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              color: "white",
              boxShadow: "0 4px 20px rgba(94, 53, 177, 0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Admins</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users size={40} className="opacity-75" />
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
                <p className="text-sm opacity-90">Active</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <UserCheck size={40} className="opacity-75" />
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
                <p className="text-sm opacity-90">Inactive</p>
                <p className="text-3xl font-bold mt-1">{stats.inactive}</p>
              </div>
              <UserX size={40} className="opacity-75" />
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
                <p className="text-sm opacity-90">Super Admins</p>
                <p className="text-3xl font-bold mt-1">{stats.superAdmins}</p>
              </div>
              <Shield size={40} className="opacity-75" />
            </div>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: colors.lavender,
              color: colors.primary,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Admins</p>
                <p className="text-3xl font-bold mt-1">{stats.regularAdmins}</p>
              </div>
              <ShieldAlert size={40} className="opacity-75" />
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
        <div className="flex flex-col gap-3">
          <TextField
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
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

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={20} style={{ color: colors.textSecondary }} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="superAdmin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>

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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
          <span className="font-bold">{filteredAdmins.length}</span>
          <span>admins found</span>
          {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
            <Button
              size="small"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              sx={{ 
                textTransform: "none", 
                ml: 1,
                color: colors.primary,
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Paper>

      {/* Admins List */}
      {filteredAdmins.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: colors.cardBg,
          }}
        >
          <Users size={64} className="mx-auto mb-4" style={{ color: colors.border }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>No admins found</h3>
          <p style={{ color: colors.textSecondary }}>
            {searchTerm || roleFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "No admin accounts have been created yet"}
          </p>
        </Paper>
      ) : (
        <div className="space-y-3">
          {filteredAdmins.map((admin) => (
            <Paper
              key={admin.id}
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
                      bgcolor: admin.role === "superAdmin" ? colors.secondary : colors.primary,
                      width: 56,
                      height: 56,
                      fontSize: "1.5rem",
                    }}
                  >
                    {admin.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>
                          {admin.name || "Unknown"}
                        </h3>
                        <p style={{ color: colors.textSecondary }} className="text-sm mb-2">
                          {admin.email || "No email"}
                        </p>
                        <div className="flex items-center gap-2 text-sm" style={{ color: colors.textSecondary }}>
                          <Calendar size={14} />
                          <span>Last Login: {formatDate(admin.lastLogin)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center mt-3">
                      <Chip
                        icon={admin.role === "superAdmin" ? <Shield size={14} /> : <ShieldAlert size={14} />}
                        label={admin.role === "superAdmin" ? "Super Admin" : "Admin"}
                        size="small"
                        sx={{
                          bgcolor: admin.role === "superAdmin" ? "#E3F2FD" : colors.lavender,
                          color: admin.role === "superAdmin" ? colors.secondary : colors.primary,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={admin.status === "active" ? <UserCheck size={14} /> : <UserX size={14} />}
                        label={admin.status === "active" ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          bgcolor: admin.status === "active" ? "#E8F5E9" : "#FFEBEE",
                          color: admin.status === "active" ? colors.success : colors.error,
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center ml-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                      {admin.status === "active" ? "Enabled" : "Disabled"}
                    </span>
                    <Switch
                      checked={admin.status === "active"}
                      onChange={() => handleStatusToggle(admin.id, admin.status)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: colors.error,
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: colors.error,
                        },
                      }}
                      disabled={statusLoading[admin.id]}
                    />
                  </div>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit size={16} />}
                    onClick={() => navigate(`/admins/${admin.id}/edit`)}
                    sx={{
                      textTransform: "none",
                      px: 3,
                      py: 1,
                      borderColor: colors.primary,
                      color: colors.primary,
                      "&:hover": {
                        borderColor: colors.primaryLight,
                        bgcolor: colors.lavender,
                      },
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Eye size={16} />}
                    onClick={() => navigate(`/admins/${admin.id}`)}
                    sx={{
                      textTransform: "none",
                      bgcolor: colors.primary,
                      "&:hover": { bgcolor: colors.primaryLight },
                      px: 3,
                      py: 1,
                      boxShadow: "0 2px 8px rgba(94, 53, 177, 0.3)",
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </Paper>
          ))}
        </div>
      )}
    </Box>
  );
}