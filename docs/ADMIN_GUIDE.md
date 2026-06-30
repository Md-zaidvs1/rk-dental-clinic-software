# RK DENTAL CLINIC SUITE v1.0 RC1 - ADMIN GUIDE
---
**Product Name:** RK Dental Clinic Suite  
**Version:** v1.0 RC1  
**Category:** Administrative & Database Governance  
**Audience:** Clinic IT Managers, Operations Owners, and Database Admins  

---

## TABLE OF CONTENTS
1. **User Account Administration & Provisioning**
2. **Access Control Roles Matrix (RBAC)**
3. **Multi-Branch clinic configuration**
4. **Clinic Backup Infrastructure & Storage Paths**
5. **Database Restore Procedures**
6. **Network & System Security Best Practices**

---

## 1. USER ACCOUNT ADMINISTRATION & PROVISIONING

System administrators (and Owner accounts) can manage clinic personnel accounts directly from the **"Users"** tab inside the system workspace.

### Step-by-Step User Provisioning:
1. Log in with the **Owner** credentials (`owner` / `password`).
2. Navigate to the **"Users"** administration tab in the main sidebar.
3. Click the **"Add New User"** button.
4. Fill in the user details:
   * **Username:** Unique login tag (e.g., `dr.smith`).
   * **Full Name:** Dr. Sarah Smith (rendered on prescriptions).
   * **Role:** Select *Doctor*, *Receptionist*, or *Owner* from the menu.
   * **Branch:** Assign to a specific clinic branch (e.g., *East Wing*).
   * **License Number / Specialization:** Required for Doctors to fulfill prescription prints.
5. Click **"Save Account"**. The newly provisioned user can log in immediately.

---

## 2. ACCESS CONTROL ROLES MATRIX (RBAC)

RK Dental Clinic Suite operates a strict Role-Based Access Control (RBAC) model to ensure HIPAA/PHI compliance.

| Feature / Module | Owner | Doctor | Receptionist |
| :--- | :---: | :---: | :---: |
| **System Settings & Backups** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **User & Staff Provisioning** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **Audit Log Inspections** | ✅ Full Access | ❌ Blocked | ❌ Blocked |
| **View Patients / Medical Profiles** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Interactive Dental Chart Diagnostics** | ✅ Full Access | ✅ Full Access | ❌ Read Only |
| **Add Treatment Plans / Prescriptions**| ✅ Full Access | ✅ Full Access | ❌ Blocked |
| **Upload Radiology (RVGs, CBCTs)** | ✅ Full Access | ✅ Full Access | ❌ Blocked |
| **Create Appointments / Manage Tokens** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Assign Inpatient Beds** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Invoicing & Bill Generation** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Process Payments** | ✅ Full Access | ✅ Full Access | ✅ Full Access |

---

## 3. MULTI-BRANCH CLINIC CONFIGURATION

The system accommodates multiple distinct geographical locations with centralized tracking of revenue and consultations.

* **Default Branches:** Built-in locations include `Main Branch` and `East Wing`.
* **Branch Switching:** When users log in, they must choose their active branch node.
* **Separation of Records:** Bills, appointments, and beds are allocated at the branch level, while patient clinical records remain unified. This allows patients to seamlessly visit any RK Dental branch.

---

## 4. CLINIC BACKUP INFRASTRUCTURE & STORAGE PATHS

### Database Locations
1. **Fallback JSON Engine:** `/data/db-fallback.json`
2. **MongoDB Community Server (Production):** Standard installation maps database directory structures to `C:\Program Files\MongoDB\Server\6.0\data\`.

### Backup Management System
* All data states are exported as portable JSON backup models containing clinics, patients, appointments, billing sheets, and treatment chart states.
* Backups can be triggered inside the system with a single click.
* Completed backup logs are kept on disk inside `/backups/` and timestamped chronologically.

---

## 5. DATABASE RESTORE PROCEDURES

In case of data recovery requirements:

1. Stop the application server to prevent lock issues.
2. Back up any existing `db-fallback.json` to a safe storage media.
3. Choose the target backup JSON file from the local directory `/backups/`.
4. Copy the file, paste it into the `/data/` folder, and rename it to `db-fallback.json` (overwriting the corrupted copy).
5. Start the server. The application will restore all clinic profiles instantly.

---

## 6. NETWORK & SYSTEM SECURITY BEST PRACTICES

To maintain maximum safety of medical and financial clinical data:

1. **Rotate Default Credentials:** Change the default password of `doctor`, `receptionist`, and `owner` accounts during the first setup phase.
2. **Configure Strong Passwords:** Ensure new staff members are assigned passwords that contain numbers and special characters.
3. **Desktop Workdesk Locking:** Ensure clinical PCs are configured to turn on password-protected screensavers after 3 minutes of inactivity.
4. **Local Network Access (LAN):** When hosting the server locally for other branch workstations, run Express over HTTPS and secure local Wi-Fi networks with WPA3 enterprise encryption.

---
*(End of Document - Ready for PDF Export)*
