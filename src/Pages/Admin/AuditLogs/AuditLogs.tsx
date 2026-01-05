import { useState, useEffect } from "react";
import {
  Paper,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Tooltip,
 
} from "@mui/material";
import {
  Download,
  Activity,
  FileText,
  RefreshCw,
  AlertCircle,
  User,
} from "lucide-react";
import { auditLogger } from "../../../service/auditLogger";
import type { AuditLog,  EntityType } from "../../../types/auditLog.types";
import Grid from "@mui/material/Grid";
import PagesLoader from "../../../components/shared/PagesLoader";
import { useAdmin } from "../../../store/MasterContext/AdminContext";
import AuditLogFilters, { type AuditLogFilterValues } from "./AuditLogFilters";

const colors = {
  primary: "#5E35B1",
  primaryLight: "#7E57C2",
  secondary: "#1E88E5",
  success: "#66BB6A",
  error: "#EF5350",
  warning: "#FFA726",
  info: "#29B6F6",
  textPrimary: "#263238",
  textSecondary: "#607D8B",
  textAudit :"#5E35B1",
};

const actionColors: Record<string, string> = {
  CREATED: colors.success,
  UPDATED: colors.info,
  DELETED: colors.error,
  DISABLED: colors.error,
  ENABLED: colors.success,
  CHANGED: colors.warning,
  ASSIGNED: colors.secondary,
  ADDED: colors.success,
  REMOVED: colors.error,
  REOPENED: colors.warning,
  CLOSED: colors.info,
  COMPLETED: colors.success,
  LOGIN: colors.textAudit,
  LOGOUT: colors.textSecondary,
};

const entityIcons: Record<EntityType, any> = {
  customer: User,
  ticket: FileText,
  generator: Activity,
  purchaseRequest: FileText,
  admin: User,
};

export default function AuditLogs() {
  const { admins, fetchAdmins } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AuditLogFilterValues>({
    searchTerm: "",
    selectedAdmin: "all",
    selectedAction: "all",
    selectedEntity: "all",
    startDate: "",
    endDate: "",
  });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Apply search filter whenever searchTerm changes
  useEffect(() => {
    applySearchFilter();
  }, [filters.searchTerm, logs]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await fetchAdmins();
      await fetchLogs();
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const queryFilters: any = { limit: 500 };
      
      if (filters.selectedAdmin !== "all") {
        queryFilters.adminId = filters.selectedAdmin;
      }
      if (filters.selectedEntity !== "all") {
        queryFilters.entityType = filters.selectedEntity as EntityType;
      }
      if (filters.startDate) {
        queryFilters.startDate = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Set end date to end of day
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        queryFilters.endDate = endDate;
      }
      
      const fetchedLogs = await auditLogger.getLogs(queryFilters);
      setLogs(fetchedLogs);
      applySearchFilter(fetchedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const applySearchFilter = (logsToFilter = logs) => {
    let filtered = [...logsToFilter];

    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.entityName?.toLowerCase().includes(term) ||
          log.adminName?.toLowerCase().includes(term) ||
          log.adminEmail?.toLowerCase().includes(term) ||
          log.action?.toLowerCase().includes(term) ||
          log.entityType?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    await fetchLogs();
    setLoading(false);
  };

  const handleClearFilters = async () => {
    setFilters({
      searchTerm: "",
      selectedAdmin: "all",
      selectedAction: "all",
      selectedEntity: "all",
      startDate: "",
      endDate: "",
    });
    setLoading(true);
    try {
      const fetchedLogs = await auditLogger.getLogs({ limit: 500 });
      setLogs(fetchedLogs);
      setFilteredLogs(fetchedLogs);
    } catch (error) {
      console.error("Error clearing filters:", error);
    } finally {
      setLoading(false);
    }
  };

  // export to csv 
  const exportToCSV = () => {
    try {
      const headers = [
        "Timestamp",
        "Action",
        "Admin Name",
        "Admin Email",
        "Admin Role",
        "Entity Type",
        "Entity Name",
        "Changes",
      ];

      const csvData = filteredLogs.map((log) => {
        const timestamp = formatDate(log.createdAt);
        const changes = log.changes?.join("; ") || "";
        
        return [
          timestamp,
          log.action || "",
          log.adminName || "",
          log.adminEmail || "",
          log.adminRole || "",
          log.entityType || "",
          log.entityName || "",
          changes,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => 
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp
      if (timestamp && typeof (timestamp as any).toDate === 'function') {
        date = (timestamp as any).toDate();
      } 
      // Handle Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle string or number timestamp
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Handle object with seconds (Firestore Timestamp-like)
      else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        date = new Date((timestamp as any).seconds * 1000);
      }
      else {
        return "Invalid Date";
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return "N/A";
    }
  };

  const getActionColor = (action: string): string => {
    if (!action) return colors.textSecondary;
    const actionKey = Object.keys(actionColors).find((key) => action.includes(key));
    return actionKey ? actionColors[actionKey] : colors.textSecondary;
  };

  const getEntityIcon = (entityType: EntityType) => {
    const Icon = entityIcons[entityType] || Activity;
    return <Icon size={16} />;
  };

  const calculateLast24HoursCount = (): number => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logs.filter((log) => {
        try {
          if (!log.createdAt) return false;
          
          let logDate: Date;
          
          // Handle Firestore Timestamp
          if (log.createdAt && typeof (log.createdAt as any).toDate === 'function') {
            logDate = (log.createdAt as any).toDate();
          } 
          // Handle Date object
          else if (log.createdAt instanceof Date) {
            logDate = log.createdAt;
          }
          // Handle string or number timestamp
          else if (typeof log.createdAt === 'string' || typeof log.createdAt === 'number') {
            logDate = new Date(log.createdAt);
          }
          // Handle object with seconds
          else if (log.createdAt && typeof log.createdAt === 'object' && 'seconds' in log.createdAt) {
            logDate = new Date((log.createdAt as any).seconds * 1000);
          }
          else {
            return false;
          }
          
          if (isNaN(logDate.getTime())) return false;
          return logDate > oneDayAgo;
        } catch {
          return false;
        }
      }).length;
    } catch {
      return 0;
    }
  };

  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && logs.length === 0) {
    return <PagesLoader text="Loading audit logs..." />;
  }

  return (
    
    <Box sx={{ maxWidth: 1900, mx: "auto", p: { xs: 2, md: 3 }, bgcolor: "#F5F5F5", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 style={{ color: colors.primary }} className="text-3xl font-bold flex items-center gap-2">
              <Activity size={32} />
              Audit Logs
            </h1>
            <p style={{ color: colors.textSecondary }} className="mt-1">
              Complete system activity history and audit trail
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Refresh logs">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  bgcolor: "white",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                {refreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshCw size={20} />
                )}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Download size={20} />}
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              sx={{
                textTransform: "none",
                bgcolor: colors.primary,
                "&:hover": { bgcolor: colors.primaryLight },
                px: 4,
                py: 1.5,
              }}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "white" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                    {logs.length}
                  </p>
                </div>
                <Activity size={40} style={{ color: colors.primary, opacity: 0.2 }} />
              </div>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "white" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Filtered Results</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.secondary }}>
                    {filteredLogs.length}
                  </p>
                </div>
                <Activity size={40} style={{ color: colors.secondary, opacity: 0.2 }} />
              </div>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "white" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Admins</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.success }}>
                    {admins.filter((a) => a.status === "active").length}
                  </p>
                </div>
                <User size={40} style={{ color: colors.success, opacity: 0.2 }} />
              </div>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: "white" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last 24 Hours</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.warning }}>
                    {calculateLast24HoursCount()}
                  </p>
                </div>
                <Activity size={40} style={{ color: colors.warning, opacity: 0.2 }} />
              </div>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Filters Component */}
      <Box sx={{ mb: 3 }}>
        <AuditLogFilters
          admins={admins}
          filters={filters}
          onFilterChange={setFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          resultCount={filteredLogs.length}
        />
      </Box>

      {/* Logs List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
         <PagesLoader  />
        </Box>
      ) : filteredLogs.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", borderRadius: 3, bgcolor: "white" }}>
          <AlertCircle size={64} className="mx-auto mb-4" style={{ color: colors.textSecondary, opacity: 0.3 }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No logs found
          </h3>
          <p style={{ color: colors.textSecondary }}>
            {filters.searchTerm ||
            filters.selectedAdmin !== "all" ||
            filters.selectedEntity !== "all" ||
            filters.startDate ||
            filters.endDate
              ? "Try adjusting your filters to see more results"
              : "No audit logs have been recorded yet"}
          </p>
        </Paper>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedLogs.map((log) => (
              <Paper
                key={log.id}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "white",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <div className="flex gap-4">
                  <Avatar
                    sx={{
                      bgcolor: getActionColor(log.action || ""),
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getEntityIcon(log.entityType)}
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Chip
                            label={log.action?.replace(/_/g, " ") || "Unknown"}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              color: getActionColor(log.action || ""),
                              border: `1px solid ${getActionColor(log.action || "")}`,
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={log.entityType || "Unknown"}
                            size="small"
                            variant="outlined"
                            sx={{ textTransform: "capitalize" }}
                          />
                        </div>
                        <h4 className="font-semibold text-lg mb-1" style={{ color: colors.textPrimary }}>
                          {log.entityName || "Unknown Entity"}
                        </h4>
                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                          by <strong>{log.adminName}</strong> ({log.adminEmail}) • {log.adminRole}
                        </p>
                      </div>
                      <span className="text-sm whitespace-nowrap ml-4" style={{ color: colors.textSecondary }}>
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    {log.changes && log.changes.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
                          Changes:
                        </p>
                        <div className="space-y-1">
                          {log.changes.map((change, idx) => (
                            <p key={idx} className="text-sm" style={{ color: colors.textPrimary }}>
                              • {change}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Paper>
            ))}
          </div>

          {/* Pagination */}
          {filteredLogs.length > rowsPerPage && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Button
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                sx={{ textTransform: "none" }}
              >
                Previous
              </Button>
              <div className="flex items-center px-4">
                <span style={{ color: colors.textSecondary }}>
                  Page {page + 1} of {Math.ceil(filteredLogs.length / rowsPerPage)} • Showing {paginatedLogs.length} of {filteredLogs.length} logs
                </span>
              </div>
              <Button
                variant="outlined"
                disabled={page >= Math.ceil(filteredLogs.length / rowsPerPage) - 1}
                onClick={() => setPage(page + 1)}
                sx={{ textTransform: "none" }}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}