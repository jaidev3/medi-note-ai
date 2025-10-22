import React from "react";
import {
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { SessionResponse } from "@/lib";

interface VisitsTableProps {
  visits: SessionResponse[];
  formatDateTime: (value?: string | null) => string;
  onViewSession: (sessionId: string) => void;
}

export const VisitsTable: React.FC<VisitsTableProps> = ({
  visits,
  formatDateTime,
  onViewSession,
}) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Visit Date</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Documents</TableCell>
            <TableCell>SOAP Notes</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visits.map((session) => (
            <TableRow key={session.session_id} hover>
              <TableCell>{formatDateTime(session.visit_date)}</TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                {session.notes ? session.notes : "—"}
              </TableCell>
              <TableCell>{session.document_count}</TableCell>
              <TableCell>{session.soap_note_count}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() => onViewSession(session.session_id)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
