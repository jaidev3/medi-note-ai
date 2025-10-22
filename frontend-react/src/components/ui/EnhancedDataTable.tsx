import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Delete,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  format?: (value: any) => string | React.ReactNode;
  sortable?: boolean;
  mobile?: boolean; // Show on mobile cards
}

interface EnhancedDataTableProps {
  columns: Column[];
  rows: any[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
  orderBy?: string;
  order?: "asc" | "desc";
  onRequestSort?: (property: string) => void;
}

const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  columns,
  rows,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  emptyMessage = "No data available",
  orderBy,
  order,
  onRequestSort,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleSort = (property: string) => {
    if (onRequestSort) {
      onRequestSort(property);
    }
  };

  const createSortHandler = (property: string) => () => {
    handleSort(property);
  };

  const renderMobileCard = (row: any) => {
    const mobileColumns = columns.filter(col => col.mobile !== false);
    
    return (
      <Card
        key={row.id}
        sx={{
          mb: 2,
          cursor: onRowClick ? "pointer" : "default",
          "&:hover": onRowClick ? {
            boxShadow: theme.shadows[4],
          } : {},
        }}
        onClick={() => onRowClick && onRowClick(row)}
      >
        <CardContent>
          <Grid container spacing={2}>
            {/* Header with title and actions */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight={600}>
                  {row[columns[0].id] || "Untitled"}
                </Typography>
                <></>
              </Box>
            </Grid>
            
            {/* Mobile columns */}
            {mobileColumns.slice(1).map((column) => (
              <Grid item xs={12} sm={6} key={column.id}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {column.label}
                </Typography>
                <Typography variant="body2">
                  {column.format ? column.format(row[column.id]) : row[column.id]}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderDesktopTable = () => (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
                sx={{
                  fontWeight: 600,
                  backgroundColor: theme.palette.grey[50],
                  borderBottom: `2px solid ${theme.palette.divider}`,
                }}
              >
                {column.sortable ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      "&:hover": { color: theme.palette.primary.main },
                    }}
                    onClick={createSortHandler(column.id)}
                  >
                    {column.label}
                    {orderBy === column.id && (
                      order === "asc" ? (
                        <ArrowUpward fontSize="small" sx={{ ml: 1 }} />
                      ) : (
                        <ArrowDownward fontSize="small" sx={{ ml: 1 }} />
                      )
                    )}
                  </Box>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: theme.palette.grey[50] }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              onClick={() => onRowClick && onRowClick(row)}
              sx={{
                cursor: onRowClick ? "pointer" : "default",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {columns.map((column) => (
                <TableCell key={column.id} align={column.align}>
                  {column.format ? column.format(row[column.id]) : row[column.id]}
                </TableCell>
              ))}
              <TableCell align="center">
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                  {onView && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(row);
                      }}
                      color="primary"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  )}
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                      }}
                      color="secondary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row);
                      }}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {rows.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {emptyMessage}
          </Typography>
        </Paper>
      ) : (
        <>
          {isMobile ? (
            <Box>
              {rows.map((row) => renderMobileCard(row))}
            </Box>
          ) : (
            renderDesktopTable()
          )}
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalRows}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            sx={{
              ".MuiTablePagination-toolbar": {
                paddingLeft: 0,
                paddingRight: 0,
              },
            }}
          />
        </>
      )}
    </Box>
  );
};

export default EnhancedDataTable;