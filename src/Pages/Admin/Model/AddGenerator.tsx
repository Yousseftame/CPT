// src/Pages/Admin/Model/AddGenerator.tsx

import { useState, type ChangeEvent, type FormEvent } from "react";
import { TextField, Button, Paper, Divider, Box } from "@mui/material";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../service/firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Zap } from "lucide-react";
import Grid from '@mui/material/Grid';
import { auditLogger } from "../../../service/auditLogger";
import { uploadFiles } from "../../../service/uploadFiles";


interface Specifications {
  phase: string;
  voltage: string;
}

interface GeneratorModel {
  name: string;
  sku: string;
  price: number | string;
  category: string;
  powerRating: string;
  description: string;
  specifications: Specifications;
  galleryImages?: string[];
  troubleshootingPDFs?: string[];
}


const categories = [
  "Portable",
  "Standby",
  "Industrial",
  "Commercial",
  "Residential",
  "Inverter"
];

const phases = ["Single Phase", "Three Phase"];
const voltages = ["110V", "220V", "230V", "240V", "380V", "400V", "480V"];

export default function AddGenerator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GeneratorModel>({
    name: "",
    sku: "",
    price: "",
    category: "",
    powerRating: "",
    description: "",
    specifications: {
      phase: "",
      voltage: "",
    },
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
const [pdfFiles, setPdfFiles] = useState<File[]>([]);


  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSpecChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Model name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (Number(formData.price) <= 0) newErrors.price = "Price must be greater than 0";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.powerRating.trim()) newErrors.powerRating = "Power rating is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.specifications.phase) newErrors.phase = "Phase is required";
    if (!formData.specifications.voltage) newErrors.voltage = "Voltage is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);


        // 🔥 Upload files (optional)
     const galleryImagesUrls =
      imageFiles.length > 0
        ? await uploadFiles(imageFiles, "generators/gallery-images")
        : [];

    const troubleshootingPdfUrls =
      pdfFiles.length > 0
        ? await uploadFiles(pdfFiles, "generators/troubleshooting-pdfs")
        : [];

    try {
      const adminUid = auth.currentUser?.uid;
      if (!adminUid) throw new Error('Not authenticated');

      const docData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        price: Number(formData.price),
        category: formData.category,
        powerRating: formData.powerRating.trim(),
        description: formData.description.trim(),
        specifications: {
          phase: formData.specifications.phase,
          voltage: formData.specifications.voltage,
        },
        galleryImages: galleryImagesUrls,
        troubleshootingPDFs: troubleshootingPdfUrls,
        createdAt: serverTimestamp(),
        createdBy: adminUid,
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "generatorModels"), docData);
      
      console.log("Document written with ID: ", docRef.id);

      // 🔥 LOG AUDIT: Generator Model Created
      await auditLogger.log({
        action: "CREATED_GENERATOR_MODEL",
        entityType: "generator",
        entityId: docRef.id,
        entityName: formData.name.trim(),
        after: docData,
      });

      toast.success("Generator model added successfully!");
      
      setTimeout(() => {
        navigate("/models");
      }, 500);
      
    } catch (error: any) {
      console.error("Error adding document: ", error);
      toast.error(error.message || "Failed to add generator model");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate("/models")}
          sx={{ 
            textTransform: 'none',
            mb: 2,
            borderRadius: 2
          }}
        >
          Back to Models
        </Button>
     
        <Box>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Add Generator Model</h1>
          <p className="text-gray-600">Create a new generator model entry</p>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid', borderColor: 'grey.200', borderRadius: 3 }}>
        <form onSubmit={handleSubmit}>
          
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Zap className="text-indigo-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
            </Box>
            <Divider sx={{ mb: 4 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Model Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder="e.g., PowerMax 5000"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  error={!!errors.sku}
                  helperText={errors.sku}
                  required
                  placeholder="e.g., GEN-PM-5000"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price (USD)"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  error={!!errors.price}
                  helperText={errors.price}
                  required
                  InputProps={{
                    startAdornment: <span className="mr-2 text-gray-500">$</span>
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Select Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  error={!!errors.category}
                  helperText={errors.category}
                  required
                  SelectProps={{ native: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Power Rating"
                  name="powerRating"
                  value={formData.powerRating}
                  onChange={handleChange}
                  error={!!errors.powerRating}
                  helperText={errors.powerRating}
                  required
                  placeholder="e.g., 5000W or 5kW"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description || "Provide a detailed description of the generator model"}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Zap className="text-indigo-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Specifications</h2>
            </Box>
            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Select Phase"
                  name="phase"
                  value={formData.specifications.phase}
                  onChange={handleSpecChange}
                  error={!!errors.phase}
                  helperText={errors.phase}
                  required
                  SelectProps={{ native: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <option value="">Select Phase</option>
                  {phases.map((phase) => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Select Voltage"
                  name="voltage"
                  value={formData.specifications.voltage}
                  onChange={handleSpecChange}
                  error={!!errors.voltage}
                  helperText={errors.voltage}
                  required
                  SelectProps={{ native: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <option value="">Select Voltage</option>
                  {voltages.map((voltage) => (
                    <option key={voltage} value={voltage}>{voltage}</option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
  <h2 className="text-xl font-semibold text-gray-800 mb-2">
    Gallery Images (Optional)
  </h2>

  <input
    type="file"
    accept="image/*"
    multiple
    onChange={(e) =>
      setImageFiles(Array.from(e.target.files || []))
    }
        className=" bg-gray-200 rounded-4xl p-2 cursor-pointer "

  />

  {imageFiles.length > 0 && (
    <p className="text-sm text-gray-500 mt-1">
      {imageFiles.length} image(s) selected
    </p>
  )}
</Box>

<Box sx={{ mb: 4 }}>
  <h2 className="text-xl font-semibold text-gray-800 mb-2">
    Troubleshooting PDFs (Optional)
  </h2>

  <input
    type="file"
    accept="application/pdf"
    multiple
    onChange={(e) =>
      setPdfFiles(Array.from(e.target.files || []))
    }
    className=" bg-gray-200 rounded-4xl p-2 cursor-pointer "
    
  />

  {pdfFiles.length > 0 && (
    <p className="text-sm text-gray-500 mt-1">
      {pdfFiles.length} PDF(s) selected
    </p>
  )}
</Box>



          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/models")}
              disabled={loading}
              sx={{ textTransform: 'none', px: 4, py: 1.5, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? null : <Save size={20} />}
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1.5,
                bgcolor: '#5E35B1',
                borderRadius: 2,
                '&:hover': { bgcolor: '#5E35B1' }
              }}
            >
              {loading ? "Saving..." : "Save Model"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}