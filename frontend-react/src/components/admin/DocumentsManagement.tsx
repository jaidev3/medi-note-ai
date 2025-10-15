import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Search,
  MoreVert,
  Visibility,
  Download,
  Delete,
  InsertDriveFile,
  PictureAsPdf,
  Image,
} from "@mui/icons-material";

// Mock data - Replace with real API calls
const mockDocuments = [
  {
    id: 1,
    fileName: "patient_records_2024.pdf",
    type: "PDF",
    uploadedBy: "Dr. Sarah Johnson",
    uploadDate: "2024-10-10",
    size: "2.4 MB",
    status: "Processed",
  },
  {
    id: 2,
    fileName: "lab_results_smith.pdf",
    type: "PDF",
    uploadedBy: "Dr. Michael Chen",
    uploadDate: "2024-10-12",
    size: "1.8 MB",
    status: "Processed",
  },
  {
    id: 3,
    fileName: "xray_scan.png",
    type: "Image",
    uploadedBy: "Dr. Emily Davis",
    uploadDate: "2024-10-13",
    size: "5.2 MB",
    status: "Processing",
  },
  {
    id: 4,
    fileName: "medical_history.docx",
    type: "Document",
    uploadedBy: "Dr. Sarah Johnson",
    uploadDate: "2024-10-14",
    size: "890 KB",
    status: "Processed",
  },
];

export const DocumentsManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    docId: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(docId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} on document ${selectedDoc}`);
    handleMenuClose();
  };

  const filteredDocuments = mockDocuments.filter(
    (doc) =>
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === "Processed" ? "success" : "warning";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <PictureAsPdf fontSize="small" />;
      case "Image":
        return <Image fontSize="small" />;
      default:
        return <InsertDriveFile fontSize="small" />;
    }
  };

  return (
    <Box>
      {/* Header Actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search documents..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {/* Documents Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getFileIcon(doc.type)}
                    <Typography variant="body2" fontWeight={500}>
                      {doc.fileName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={doc.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {doc.uploadedBy}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {doc.uploadDate}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{doc.size}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={doc.status}
                    size="small"
                    color={getStatusColor(doc.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, doc.id)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction("view")}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Document
        </MenuItem>
        <MenuItem onClick={() => handleAction("download")}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Document
        </MenuItem>
      </Menu>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">No documents found</Typography>
        </Box>
      )}
    </Box>
  );
};
