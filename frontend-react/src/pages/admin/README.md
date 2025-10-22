# Admin Dashboard

A comprehensive admin dashboard for managing the MediNote AI application.

## Features

### Overview Dashboard

- **Statistics Cards**: Real-time metrics for users, patients, sessions, and documents
- **System Activity**: 7-day overview of new users, patients, sessions, and documents
- **Storage Usage**: Visual representation of system storage metrics

### User Management

- View all users with their roles and status
- Search users by name or email
- Filter by role (Admin, Professional)
- Actions:
  - Edit user details
  - Deactivate/Activate users
  - Delete users
- Add new users

### Patient Management

- View all patients with medical record numbers (MRN)
- Search patients by name or MRN
- View patient demographics (age, gender)
- Track session count per patient
- Actions:
  - View patient details
  - Edit patient information
  - Delete patients
- Add new patients

### Session Management

- View all patient visit sessions
- Search by patient name or professional
- Track SOAP note status
- Monitor recording sizes
- Actions:
  - View session details
  - Delete sessions

### Document Management

- View all uploaded documents
- Search by filename or uploader
- Filter by document type (PDF, Image, Document)
- Monitor document processing status
- Track file sizes
- Actions:
  - View documents
  - Download documents
  - Delete documents

### System Settings

- **Authentication Settings**:
  - Toggle user registration
  - Enable/disable email verification
  - Two-factor authentication control
- **System Settings**:
  - Maintenance mode
  - Automatic backup configuration
- **Resource Limits**:
  - Max upload size (MB)
  - Session timeout (minutes)
  - API rate limiting (requests/min)

## Access

Navigate to `/admin` to access the admin dashboard.

**Note**: This is a UI-only implementation. Backend integration is required for full functionality.

## Components

### AdminStatsCard

Displays statistical information with icons and color coding.

### UsersManagement

Table-based interface for managing system users.

### PatientsManagement

Table-based interface for managing patient records.

### SessionsManagement

Table-based interface for viewing and managing patient sessions.

### DocumentsManagement

Table-based interface for managing uploaded documents.

### SystemSettings

Configuration panel for system-wide settings.

## Future Enhancements

- Real API integration
- Role-based access control (RBAC)
- Audit logging
- Data export functionality
- Advanced filtering and sorting
- Bulk operations
- Email notifications
- Activity timeline
- Analytics and reporting
- Dark mode support
