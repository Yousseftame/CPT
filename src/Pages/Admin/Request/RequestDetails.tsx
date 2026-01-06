import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../service/firebase";
import {
  Button,
  TextField,
  Paper,
  Box,
  Divider,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Package,
  CheckCircle2,
  MessageSquare,
  Plus,
  Hash,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  XCircle,
  ChevronDown,
  AlertTriangle,
  Check,
} from "lucide-react";
import PagesLoader from "../../../components/shared/PagesLoader";
import { useRequest } from "../../../store/MasterContext/RequestContext";

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

interface GeneratorModel {
  id: string;
  name: string;
  sku: string;
}

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getRequestById,
    updateRequestStatus,
    assignUnit,
    addInternalNote,
    updateAssignedUnit,
    removeAssignedUnit,
    removeInternalNote,
  } = useRequest();

  const [request, setRequest] = useState<any>(null);
  const [models, setModels] = useState<GeneratorModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  // Dialogs state
  const [assignDialog, setAssignDialog] = useState(false);
  const [editUnitDialog, setEditUnitDialog] = useState(false);
  const [deleteUnitDialog, setDeleteUnitDialog] = useState(false);
  const [deleteNoteDialog, setDeleteNoteDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState(false);

  // Form state
  const [selectedModel, setSelectedModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(-1);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(-1);

  const fetchRequest = async () => {
    if (!id) return;

    try {
      const data = await getRequestById(id);
      if (data) {
        setRequest(data);
      } else {
        navigate("/requests");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const q = query(collection(db, "generatorModels"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        sku: doc.data().sku,
      }));
      setModels(data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  useEffect(() => {
    fetchRequest();
    fetchModels();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    await updateRequestStatus(id, newStatus as any);
    fetchRequest();
  };

  const handleAssignUnit = async () => {
    if (!selectedModel || !serialNumber.trim()) return;
    setDisabled(true);
    try {
      await assignUnit(id!, { modelId: selectedModel, serial: serialNumber });
      setAssignDialog(false);
      setSelectedModel("");
      setSerialNumber("");
      fetchRequest();
    } finally {
      setDisabled(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setDisabled(true);
    try {
      await addInternalNote(id!, noteText);
      setNoteDialog(false);
      setNoteText("");
      fetchRequest();
    } finally {
      setDisabled(false);
    }
  };

  const handleEditUnit = async () => {
    if (!selectedModel || !serialNumber.trim() || selectedUnitIndex === -1) return;
    setDisabled(true);
    try {
      await updateAssignedUnit(id!, selectedUnitIndex, { modelId: selectedModel, serial: serialNumber });
      setEditUnitDialog(false);
      setSelectedModel("");
      setSerialNumber("");
      setSelectedUnitIndex(-1);
      fetchRequest();
    } finally {
      setDisabled(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (selectedUnitIndex === -1) return;
    setDisabled(true);
    try {
      await removeAssignedUnit(id!, selectedUnitIndex);
      setDeleteUnitDialog(false);
      setSelectedUnitIndex(-1);
      fetchRequest();
    } finally {
      setDisabled(false);
    }
  };

  const handleDeleteNote = async () => {
    if (selectedNoteIndex === -1) return;
    setDisabled(true);
    try {
      await removeInternalNote(id!, selectedNoteIndex);
      setDeleteNoteDialog(false);
      setSelectedNoteIndex(-1);
      fetchRequest();
    } finally {
      setDisabled(false);
    }
  };

  const openEditUnitDialog = (unit: any, index: number) => {
    setSelectedUnitIndex(index);
    setSelectedModel(unit.modelId);
    setSerialNumber(unit.serial);
    setEditUnitDialog(true);
  };

  const openDeleteUnitDialog = (index: number) => {
    setSelectedUnitIndex(index);
    setDeleteUnitDialog(true);
  };

  const openDeleteNoteDialog = (index: number) => {
    setSelectedNoteIndex(index);
    setDeleteNoteDialog(true);
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || "Unknown Model";
  };

  const getModelSKU = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.sku || "N/A";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return { bgcolor: "#EEF2FF", color: "#4F46E5" };
      case "in_review":
        return { bgcolor: "#FEF3C7", color: "#F59E0B" };
      case "contacted":
        return { bgcolor: "#F0F9FF", color: "#3B82F6" };
      case "approved":
        return { bgcolor: "#F6FFED", color: "#6CC464" };
      case "rejected":
        return { bgcolor: "#FFF1F0", color: "#FF5F5E" };
      case "completed":
        return { bgcolor: "#F3F4F6", color: "#6B7280" };
      default:
        return { bgcolor: "#F3F4F6", color: "#6B7280" };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return <PagesLoader text="Loading request details..." />;
  }

  if (!request) {
    return null;
  }

  const statusStyle = getStatusColor(request.status);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate("/requests")}
          sx={{
            textTransform: "none",
            mb: 2,
            borderRadius: 2,
          }}
        >
          Back to Requests
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: "#5E35B1",
                width: 64,
                height: 64,
                fontSize: "1.5rem",
              }}
            >
              {request.customerName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <h1 className="text-3xl font-bold text-gray-800">Purchase Request</h1>
              <p className="text-gray-600 mt-1">Request ID: {id}</p>
            </Box>
          </Box>

          {/* Status Dropdown */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select
              value={request.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{
                bgcolor: statusStyle.bgcolor,
                color: statusStyle.color,
                fontWeight: 600,
                fontSize: "1rem",
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                borderRadius: 2,
                py: 1.5,
              }}
              IconComponent={ChevronDown}
            >
              <MenuItem value="new">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} />
                  New
                </div>
              </MenuItem>
              <MenuItem value="in_review">
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  In Review
                </div>
              </MenuItem>
              <MenuItem value="contacted">
                <div className="flex items-center gap-2">
                  <Phone size={18} />
                  Contacted
                </div>
              </MenuItem>
              <MenuItem value="approved">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Approved
                </div>
              </MenuItem>
              <MenuItem value="rejected">
                <div className="flex items-center gap-2">
                  <XCircle size={18} />
                  Rejected
                </div>
              </MenuItem>
              <MenuItem value="completed">
                <div className="flex items-center gap-2">
                  <Package size={18} />
                  Completed
                </div>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Quick Info Cards */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          mb: 4,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Package size={32} />
            <Box>
              <p className="text-sm opacity-90">Requested Units</p>
              <p className="text-3xl font-bold">{request.requestedUnits}</p>
            </Box>
          </Box>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CheckCircle2 size={32} />
            <Box>
              <p className="text-sm opacity-90 ">Assigned Units</p>
              <p className="text-3xl font-bold">{request.assignedUnits?.length || 0}</p>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${colors.accent} 0%, #FFA726 100%)`,
            color: "white",
            boxShadow: "0 4px 20px rgba(255, 183, 77, 0.3)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MessageSquare size={32} />
            <Box>
              <p className="text-sm opacity-90">Internal Notes</p>
              <p className="text-3xl font-bold">{request.internalNotes?.length || 0}</p>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" } }}>
        {/* Customer Information */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: "1px solid",
            borderColor: "grey.200",
            borderRadius: 3,
            height: "fit-content",
          }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Information</h2>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <User size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">Name</span>
              </Box>
              <p className="text-gray-900 font-medium">{request.customerName}</p>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Phone size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">Phone</span>
              </Box>
              <p className="text-gray-900 font-medium">{request.customerPhone}</p>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Package size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">Model Requested</span>
              </Box>
              <p className="text-gray-900 font-medium">{request.modelId}</p>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">Created At</span>
              </Box>
              <p className="text-gray-900 font-medium">
                {formatDate(request.createdAt?.toDate?.() || request.createdAt)}
              </p>
            </Box>
          </Box>
        </Paper>

        {/* Right Column - Assigned Units & Notes */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Assigned Units */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <h2 className="text-xl font-semibold text-gray-800">Assigned Units</h2>
              {request.status === "approved" && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => setAssignDialog(true)}
                  sx={{
                    py : 1,
                    px : 2,
                    textTransform: "none",
                    bgcolor: "#5E35B1",
                    "&:hover": { bgcolor: "#5E35B1" },
                  }}
                >
                  Assign Unit
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            {!request.assignedUnits || request.assignedUnits.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-lg">No units assigned yet</p>
                {request.status === "approved" && (
                  <p className="text-sm">Click "Assign Unit" to add generator units</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {request.assignedUnits.map((unit: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {getModelName(unit.modelId)}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Chip
                            label={getModelSKU(unit.modelId)}
                            size="small"
                            sx={{ bgcolor: "#EEF2FF", color: "#4F46E5" }}
                          />
                          <Chip
                            icon={<Hash size={14} />}
                            label={unit.serial}
                            size="small"
                            sx={{ bgcolor: "#F6FFED", color: "#6CC464" }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Assigned: {formatDate(unit.assignedAt)}
                        </p>
                      </div>
                      {request.status === "approved" && (
                        <div className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => openEditUnitDialog(unit, index)}
                            sx={{ color: "#4F46E5" }}
                          >
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => openDeleteUnitDialog(index)}
                            sx={{ color: "#DC2626" }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Paper>

          {/* Internal Notes */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: "1px solid",
              borderColor: "grey.200",
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <h2 className="text-xl font-semibold text-gray-800">Internal Notes</h2>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => setNoteDialog(true)}
                sx={{ textTransform: "none" }}
              >
                Add Note
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {!request.internalNotes || request.internalNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-lg">No notes yet</p>
                <p className="text-sm">Add internal notes to track this request</p>
              </div>
            ) : (
              <div className="space-y-3">
                {request.internalNotes.map((note: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 mb-2">{note.note}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{note.createdByName || note.createdBy}</span>
                          <span>•</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                      <IconButton
                        size="small"
                        onClick={() => openDeleteNoteDialog(index)}
                        sx={{ color: "#DC2626" }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Dialogs */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Package className="text-indigo-600" size={24} />
            <span>Assign Generator Unit</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Model</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="Select Model"
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} ({model.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Enter unit serial number"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAssignDialog(false)} sx={{ textTransform: "none" }} disabled={disabled}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignUnit}
            variant="contained"
            sx={{
              py : 1,
              px : 2,
              textTransform: "none",
              bgcolor: "#5E35B1",
              "&:hover": { bgcolor: "#5E35B1" },
            }}
            disabled={disabled}
          >
            {disabled ? <Check /> : "Assign Unit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={24} />
            <span>Add Internal Note</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add internal note about this request..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setNoteDialog(false)} sx={{ textTransform: "none" }} disabled={disabled}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
            }}
            disabled={disabled}
          >
            {disabled ? <Check /> : "Add Note"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editUnitDialog} onClose={() => setEditUnitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Edit className="text-indigo-600" size={24} />
            <span>Edit Generator Unit</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Model</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="Select Model"
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} ({model.sku})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Enter unit serial number"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditUnitDialog(false)} sx={{ textTransform: "none" }} disabled={disabled}>
            Cancel
          </Button>
          <Button
            onClick={handleEditUnit}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
            }}
            disabled={disabled}
          >
            {disabled ? <Check /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteUnitDialog} onClose={() => setDeleteUnitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="text-red-600">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} />
            <span>Remove Unit</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove this assigned unit?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteUnitDialog(false)} sx={{ textTransform: "none" }} disabled={disabled}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUnit}
            variant="contained"
            color="error"
            sx={{ textTransform: "none" }}
            disabled={disabled}
          >
            {disabled ? <Check /> : "Remove Unit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteNoteDialog} onClose={() => setDeleteNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="text-red-600">
          <div className="flex items-center gap-2">
            <AlertTriangle size={24} />
            <span>Delete Note</span>
          </div>
        </DialogTitle>
        <DialogContent>
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this internal note?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteNoteDialog(false)} sx={{ textTransform: "none" }} disabled={disabled} >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteNote}
            variant="contained"
            color="error"
            sx={{ textTransform: "none" }}
            disabled={disabled}
          >
            {disabled ? <Check /> : "Delete Note"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}