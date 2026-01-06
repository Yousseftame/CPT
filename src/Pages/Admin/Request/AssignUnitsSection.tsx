import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../service/firebase";
import { TextField, Button } from "@mui/material";
import { Check } from "lucide-react";
import { useRequest } from "../../../store/MasterContext/RequestContext";

type GeneratorModel = {
  id: string;
  name?: string;
  [key: string]: any;
};

const AssignUnitsSection = ({ request }: any) => {
  const { assignUnit, addInternalNote, completeRequest } = useRequest();
  const [models, setModels] = useState<GeneratorModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [serial, setSerial] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // fetch generator models for selection
  const fetchModels = async () => {
    const snap = await getDocs(collection(db, "generatorModels"));
    setModels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // assign unit models 
  const handleAssignUnit = async () => {
    if (!selectedModel || !serial) return;
    
    setLoading(true);
    try {
      await assignUnit(request.id, { modelId: selectedModel, serial });
      setSelectedModel("");
      setSerial("");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  // add internal note
  const handleAddNote = async () => {
    if (!note.trim()) return;

    try {
      await addInternalNote(request.id, note);
      setNote("");
      window.location.reload();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // complete request case
  const handleCompleteRequest = async () => {
    try {
      await completeRequest(request.id);
      setCompleted(true);
    } catch (error) {
      console.error("Error completing request:", error);
    }
  };

  if (completed || request.status === "completed") {
    return (
      <div className="mt-6 p-4 border rounded bg-green-50">
        <p className="font-semibold text-green-700">
          Request Completed ✔
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold">Assign Units</h3>

      <select
        className="border p-2 mt-2 w-full rounded"
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option value="">Select Model</option>
        {models.map((m: any) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <TextField
        label="Serial Number"
        className="mt-3"
        fullWidth
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
      />

      <Button
        variant="contained"
        className="mt-3"
        onClick={handleAssignUnit}
        sx={{ 
          bgcolor: '#5E35B1',
          '&:hover': { bgcolor: '#7E57C2' }
        }}
        disabled={loading}
      >
        {loading ? <Check /> : "Add Assigned Unit"}
      </Button>

      <hr className="my-4" />

      <h3 className="text-lg font-semibold">Internal Notes</h3>

      <TextField
        label="Add Note"
        multiline
        fullWidth
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mt-2"
      />

      <Button
        variant="outlined"
        className="mt-3"
        onClick={handleAddNote}
      >
        Add Note
      </Button>

      <hr className="my-4" />

      <Button
        variant="contained"
        color="success"
        onClick={handleCompleteRequest}
      >
        Mark as Completed
      </Button>

      {request.internalNotes?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">Internal Notes</h3>

          {request.internalNotes.map((n: any, index: number) => (
            <div key={index} className="border p-2 mb-2 rounded bg-gray-50">
              <p>{n.note}</p>
              <small className="text-gray-500">
                by {n.createdByName || n.createdBy} — {new Date(n.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}

      {request.assignedUnits?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">Assigned Units</h3>

          {request.assignedUnits.map((unit: any, index: number) => {
            const model = models.find(m => m.id === unit.modelId);
            return (
              <div key={index} className="border p-2 mb-2 rounded">
                <p><strong>Model:</strong> {model?.name || unit.modelId}</p>
                <p><strong>Serial:</strong> {unit.serial}</p>
                <p><strong>Assigned At:</strong> {new Date(unit.assignedAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignUnitsSection;