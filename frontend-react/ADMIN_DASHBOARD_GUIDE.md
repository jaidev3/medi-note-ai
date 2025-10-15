# Admin Dashboard - Quick Start Guide

## Overview

The Admin Dashboard provides a comprehensive interface for managing all aspects of the MediNote AI application.

## Getting Started

### Accessing the Dashboard

1. Navigate to `/admin` or click "Admin Dashboard" from the main dashboard
2. You'll see the overview page with key statistics and system metrics

### Dashboard Layout

#### Top Section - Statistics Overview

Four key metric cards:

- **Total Users**: Number of registered users (with breakdown of professionals)
- **Total Patients**: Number of patients in the system (with today's active count)
- **Total Sessions**: Number of patient sessions (with SOAP note count)
- **Documents**: Number of uploaded documents (with storage usage)

#### Middle Section - System Health

Two cards showing:

- **System Activity**: Last 7 days metrics (new users, patients, sessions, documents)
- **Storage Usage**: Visual progress bar showing storage consumption

#### Bottom Section - Management Tabs

Five tabs for different management areas:

1. **Users Tab** - User management interface
2. **Patients Tab** - Patient records management
3. **Sessions Tab** - Session tracking and management
4. **Documents Tab** - Document library management
5. **Settings Tab** - System configuration

## Features by Tab

### 1. Users Management

**Purpose**: Manage system users and their permissions

**Features**:

- Search users by name or email
- View user details (name, email, role, status, creation date, last login)
- Add new users via "Add New User" button
- User actions menu (⋮):
  - Edit User
  - Deactivate
  - Delete User

**Visual Indicators**:

- Role badges: Admin (red), Professional (blue)
- Status chips: Active (green), Inactive (gray)

### 2. Patients Management

**Purpose**: Manage patient records

**Features**:

- Search patients by name or MRN
- View patient details (name, MRN, age, gender, last visit, session count)
- Add new patients via "Add New Patient" button
- Patient actions menu (⋮):
  - View Details
  - Edit Patient
  - Delete Patient

**Visual Indicators**:

- Status chips: Active (green), Inactive (gray)
- Session count badges

### 3. Sessions Management

**Purpose**: Track and manage patient visit sessions

**Features**:

- Search sessions by patient name or professional
- View session details (patient, date, duration, professional, SOAP status, recording size)
- Session actions menu (⋮):
  - View Session
  - Delete Session

**Visual Indicators**:

- SOAP Status: Completed (green), Pending (yellow)
- Recording size displayed

### 4. Documents Management

**Purpose**: Manage uploaded documents

**Features**:

- Search documents by filename or uploader
- View document details (filename, type, uploader, upload date, size, status)
- Document actions menu (⋮):
  - View Document
  - Download
  - Delete Document

**Visual Indicators**:

- File type icons (PDF, Image, Document)
- Processing status: Processed (green), Processing (yellow)

### 5. System Settings

**Purpose**: Configure system-wide settings

**Settings Groups**:

**Authentication Settings**:

- Allow User Registration (toggle)
- Require Email Verification (toggle)
- Enable Two-Factor Authentication (toggle)

**System Settings**:

- Maintenance Mode (toggle)
- Automatic Backup (toggle)

**Resource Limits**:

- Max Upload Size (MB)
- Session Timeout (minutes)
- API Rate Limit (requests/min)

**Actions**:

- "Reset to Defaults" - Restore default settings
- "Save Settings" - Apply changes

## Color Coding Guide

- **Primary Blue**: User-related items, general actions
- **Secondary Purple**: Patient-related items
- **Success Green**: Active status, completed items
- **Warning Yellow**: Pending status, processing items
- **Error Red**: Admin role, delete actions, inactive status

## Keyboard Shortcuts & Tips

1. Use the search boxes to quickly filter results
2. Click on table rows to select items
3. Use the action menu (⋮) for item-specific actions
4. All changes require confirmation (coming in future updates)

## Mock Data Notice

⚠️ **Important**: This is currently a UI-only implementation with mock data.

- All displayed data is sample data
- Actions will not persist
- Backend integration is required for full functionality

## Next Steps

To make this functional:

1. Connect to backend API endpoints
2. Implement role-based access control
3. Add confirmation dialogs for destructive actions
4. Implement real-time updates
5. Add pagination for large datasets
6. Create audit logging for admin actions

## Support

For issues or feature requests, please contact the development team.
