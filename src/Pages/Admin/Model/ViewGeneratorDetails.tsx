import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../service/firebase";
import toast from "react-hot-toast";
import { 
  ArrowLeft, 
  Edit, 
  Zap, 
  DollarSign, 
  Info, 
  Settings,
  Package,
  Calendar,
  Tag,
  FileText,
  Download,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink
} from "lucide-react";
import { 
  Paper, 
  Button, 
  Chip, 
  Box,
  Divider,
  Dialog,
  IconButton
} from "@mui/material";
import PagesLoader from "../../../components/shared/PagesLoader";

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
  createdAt?: any;
  updatedAt?: any;
}

export default function ViewGeneratorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<GeneratorModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchModel = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "generatorModels", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setModel({
            id: docSnap.id,
            ...(docSnap.data() as Omit<GeneratorModel, "id">),
          });
        } else {
          toast.error("Model not found");
          navigate("/models");
        }
      } catch (error) {
        toast.error("Failed to fetch model details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchModel();
  }, [id, navigate]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp.toDate()).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "N/A";
    }
  };

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const handleNextImage = () => {
    if (model?.galleryImages) {
      setSelectedImageIndex((prev) => 
        prev === model.galleryImages!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (model?.galleryImages) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? model.galleryImages!.length - 1 : prev - 1
      );
    }
  };

  const handleDownloadPDF = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model?.name}_troubleshooting_${index + 1}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <PagesLoader text="Loading generator model data..." />;
  }

  if (!model) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowLeft size={20} />}
          onClick={() => navigate("/models")}
          sx={{
            textTransform: "none",
            mb: 2,
            borderRadius: 2,
          }}
        >
          Back to Models
        </Button>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Box>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {model.name}
            </h1>
            <Chip
              label={model.category}
              sx={{
                bgcolor: "#FFF1F0",
                color: "#FF5F5E",
                fontWeight: 600,
              }}
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<Edit size={20} />}
            onClick={() => navigate(`/models/edit/${id}`)}
            sx={{
              textTransform: "none",
              px: 4,
              py: 1.5,
              bgcolor: "#5E35B1",
              borderRadius: 2,
              "&:hover": { bgcolor: "#4338CA" },
            }}
          >
            Edit Model
          </Button>
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        
        {/* Left Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Overview Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                borderRadius: 2,
                backdropFilter: 'blur(10px)'
              }}>
                <Zap size={32} />
              </Box>
              <Box>
                <p className="text-sm opacity-90">Power Output</p>
                <h2 className="text-3xl font-bold">{model.powerRating}</h2>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={`${model.specifications.phase}`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 600
                }}
              />
              <Chip
                label={`${model.specifications.voltage}`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 600
                }}
              />
            </Box>
          </Paper>

          {/* Gallery Images Section */}
          {model.galleryImages && model.galleryImages.length > 0 && (
            <Paper elevation={0} sx={{ 
              p: 4, 
              border: '1px solid', 
              borderColor: 'grey.200', 
              borderRadius: 3 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ImageIcon className="text-indigo-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Gallery Images</h2>
                <Chip 
                  label={`${model.galleryImages.length} ${model.galleryImages.length === 1 ? 'image' : 'images'}`}
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', ml: 'auto' }}
                />
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 2
              }}>
                {model.galleryImages.map((img, index) => (
                  <Box
                    key={index}
                    onClick={() => openImageDialog(index)}
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        '& .overlay': {
                          opacity: 1
                        }
                      }
                    }}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      className="overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <ExternalLink size={24} color="white" />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Description Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Info className="text-indigo-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Description</h2>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <p className="text-gray-700 leading-relaxed">{model.description}</p>
          </Paper>

          {/* Specifications Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Settings className="text-indigo-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">
                Technical Specifications
              </h2>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'grid', gap: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                p: 2,
                bgcolor: '#F9FAFB',
                borderRadius: 2
              }}>
                <span className="text-gray-600 font-medium">Phase Configuration</span>
                <span className="text-gray-900 font-semibold">
                  {model.specifications.phase}
                </span>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                p: 2,
                bgcolor: '#F9FAFB',
                borderRadius: 2
              }}>
                <span className="text-gray-600 font-medium">Voltage Rating</span>
                <span className="text-gray-900 font-semibold">
                  {model.specifications.voltage}
                </span>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                p: 2,
                bgcolor: '#F9FAFB',
                borderRadius: 2
              }}>
                <span className="text-gray-600 font-medium">Power Output</span>
                <span className="text-gray-900 font-semibold">
                  {model.powerRating}
                </span>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Price Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <DollarSign size={24} />
              <span className="text-sm opacity-90">Price</span>
            </Box>
            <h2 className="text-4xl font-bold mb-1">
              ${model.price.toLocaleString()}
            </h2>
            <p className="text-sm opacity-90">EGP</p>
          </Paper>

          {/* Troubleshooting PDFs Section */}
          {model.troubleshootingPDFs && model.troubleshootingPDFs.length > 0 && (
            <Paper elevation={0} sx={{ 
              p: 4, 
              border: '1px solid', 
              borderColor: 'grey.200', 
              borderRadius: 3 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <FileText className="text-indigo-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">
                  Troubleshooting PDFs
                </h2>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {model.troubleshootingPDFs.map((pdf, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 3,
                      bgcolor: '#F9FAFB',
                      borderRadius: 2,
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#5E35B1',
                        bgcolor: '#F3F4F6',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: 'white', 
                        borderRadius: 1.5,
                        border: '1px solid #E5E7EB'
                      }}>
                        <FileText size={20} className="text-red-600" />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <p className="text-sm font-semibold text-gray-800">
                          Troubleshooting Guide {index + 1}
                        </p>
                        <p className="text-xs text-gray-500">PDF Document</p>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ExternalLink size={16} />}
                        onClick={() => window.open(pdf, '_blank')}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          borderColor: '#5E35B1',
                          color: '#5E35B1',
                          '&:hover': {
                            borderColor: '#4338CA',
                            bgcolor: '#F3F4F6'
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Download size={16} />}
                        onClick={() => handleDownloadPDF(pdf, index)}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          bgcolor: '#5E35B1',
                          '&:hover': {
                            bgcolor: '#4338CA'
                          }
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Product Info Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Package className="text-indigo-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">
                Product Information
              </h2>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Tag size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-500">SKU</span>
                </Box>
                <p className="text-gray-900 font-semibold">{model.sku}</p>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Package size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-500">Category</span>
                </Box>
                <p className="text-gray-900 font-semibold">{model.category}</p>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-500">Created</span>
                </Box>
                <p className="text-gray-900 font-semibold">
                  {formatDate(model.createdAt)}
                </p>
              </Box>

              {model.updatedAt && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-500">Last Updated</span>
                  </Box>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(model.updatedAt)}
                  </p>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Quick Stats Card */}
          <Paper elevation={0} sx={{ 
            p: 4, 
            border: '1px solid', 
            borderColor: 'grey.200', 
            borderRadius: 3,
            bgcolor: '#F9FAFB'
          }}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              QUICK STATS
            </h3>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm text-gray-600">Status</span>
                <Chip 
                  label="Active" 
                  size="small"
                  sx={{ bgcolor: '#10B981', color: 'white', fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-semibold text-gray-900">
                  Generator
                </span>
              </Box>
              {model.galleryImages && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-sm text-gray-600">Images</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {model.galleryImages.length}
                  </span>
                </Box>
              )}
              {model.troubleshootingPDFs && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {model.troubleshootingPDFs.length}
                  </span>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Image Viewer Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative', bgcolor: 'rgba(0,0,0,0.95)', p: 2 }}>
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              zIndex: 1
            }}
          >
            <X size={24} />
          </IconButton>

          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            {model.galleryImages && model.galleryImages.length > 1 && (
              <>
                <IconButton
                  onClick={handlePrevImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <ChevronLeft size={32} />
                </IconButton>

                <IconButton
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <ChevronRight size={32} />
                </IconButton>
              </>
            )}

            {model.galleryImages && (
              <img
                src={model.galleryImages[selectedImageIndex]}
                alt={`Gallery ${selectedImageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            )}
          </Box>

          {model.galleryImages && model.galleryImages.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
              {model.galleryImages.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: index === selectedImageIndex ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.7)'
                    }
                  }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2, color: 'white' }}>
            <p className="text-sm opacity-70">
              Image {selectedImageIndex + 1} of {model.galleryImages?.length}
            </p>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}