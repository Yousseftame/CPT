import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Button, 
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Menu,
  MenuItem,
  InputAdornment
} from "@mui/material";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  X,
  AlertTriangle,
  Eye,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../service/firebase";
import toast from "react-hot-toast";
import PagesLoader from "../../../components/shared/PagesLoader";
import { deleteFileByUrl } from "../../../service/deleteFileByUrl";

interface GeneratorModel {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  powerRating: string;
  description: string;
  specifications: {
    phase: string;
    voltage: string;
  };
   galleryImages?: string[];
  troubleshootingPDFs?: string[];
  
}

export default function GeneratorList() {
  const [models, setModels] = useState<GeneratorModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<GeneratorModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<GeneratorModel | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedModel, setSelectedModel] = useState<GeneratorModel | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);
  
  const navigate = useNavigate();

  const fetchModels = async () => {
    setLoading(true);
    try {
      const q = query(
  collection(db, "generatorModels"),
  orderBy("createdAt", "desc")
);
      const snapshot = await  getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<GeneratorModel, "id">),
      }));
      setModels(data);
      setFilteredModels(data);
    } catch (error) {
      toast.error("Failed to fetch models");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Filter and Search Logic
  useEffect(() => {
    let filtered = models;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(model => 
        model.category.toLowerCase() === categoryFilter.toLowerCase()
      );  
    }

    setFilteredModels(filtered);
    setPage(0);
  }, [searchTerm, categoryFilter, models]);


  // delete model 
  const handleDelete = async () => {
  if (!modelToDelete) return;

   setDisableLoading(true);
  try {
    const {
      id,
      name,
      galleryImages = [],
      troubleshootingPDFs = [],
    } = modelToDelete;

    // 1. delete storage files first
    await Promise.all([
      ...galleryImages.map(deleteFileByUrl),
      ...troubleshootingPDFs.map(deleteFileByUrl),
    ]);

    // 2.  delete firestore document
    await deleteDoc(doc(db, "generatorModels", id));

    toast.success(`${name} deleted successfully`);
    setDeleteDialog(false);
    setModelToDelete(null);
    fetchModels();
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete model");
  }
  finally {
    setDisableLoading(false);
  }
};


  const openDeleteDialog = (model: GeneratorModel) => {
    setModelToDelete(model);
    setDeleteDialog(true);
    handleMenuClose();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, model: GeneratorModel) => {
    setAnchorEl(event.currentTarget);
    setSelectedModel(model);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModel(null);
  };

  // paginate
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  //paginate
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const categories = Array.from(new Set(models.map(m => m.category)));

  const paginatedModels = filteredModels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
     <PagesLoader text="Loading generator models..." />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold  text-[#5E35B1]">Generator Models</h1>
          <p className="text-gray-600 mt-1">Manage your generator inventory</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate("/models/add")}
          sx={{
            bgcolor: '#5E35B1',
            '&:hover': { bgcolor: '#5E35B1' },
            textTransform: 'none',
            px: 3,
            py: 1.5,
            borderRadius: 2
          }}
        >
          Add New Model
        </Button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <TextField
            placeholder="Search by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-bold ">{filteredModels.length}</span>
          <span>results found</span>
          {(searchTerm || categoryFilter !== "all") && (
            <Button
              size="small"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
              }}
              sx={{ textTransform: 'none', ml: 1 }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Model Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Power Rating</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Specifications</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#374151', textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <div className="text-gray-400">
                      <Search size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-lg">No models found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModels.map((model) => (
                  <TableRow 
                    key={model.id}
                    sx={{ 
                      '&:hover': { bgcolor: '#F9FAFB' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">{model.name}</p>
                        <p className="text-sm text-gray-500">{model.description?.substring(0, 50)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.sku} 
                        size="small" 
                        sx={{ bgcolor: '#EEF2FF', color: '#4F46E5' }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700"><Chip 
                        label={model.category} 
                        size="small" 
                        sx={{ bgcolor: '#FFF1F0', color: '#FF5F5E' }}
                      /></span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-800">{model.powerRating}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600"> 
                        <Chip 
                        label= {`$${model.price.toLocaleString()}`}
                        size="small" 
                        sx={{ bgcolor: '#F6FFED', color: 'green' }}
                      /></span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Phase:</span> {model.specifications?.phase || 'N/A'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Voltage:</span> {model.specifications?.voltage || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, model)}
                        size="small"
                      >
                        <MoreVertical size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          component="div"
          count={filteredModels.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </div>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => {
            if (selectedModel) navigate(`/models/view/${selectedModel.id}`);
            handleMenuClose();
          }}
        >
          <Eye size={16} className="mr-2" />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedModel) navigate(`/models/edit/${selectedModel.id}`);
            handleMenuClose();
          }}
        >
          <Edit size={16} className="mr-2" />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => selectedModel && openDeleteDialog(selectedModel)}
          sx={{ color: '#DC2626' }}
        >
          <Trash2 size={16} className="mr-2" />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center gap-3 text-red-600">
          <AlertTriangle size={24} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <strong>{modelToDelete?.name}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All data associated with this model will be permanently deleted.
            </p>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            variant="outlined"
            sx={{ textTransform: 'none' }}
            disabled={disableLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            startIcon={<Trash2 size={16} />}
            sx={{ textTransform: 'none' }}
            disabled={disableLoading}
          >
            {disableLoading ? <Check  /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}