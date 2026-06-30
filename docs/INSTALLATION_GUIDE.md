# RK DENTAL CLINIC SUITE v1.0 RC1 - INSTALLATION GUIDE
---
**Product Name:** RK Dental Clinic Suite  
**Version:** v1.0 RC1  
**Category:** Medical & Dental EHR Desktop Workspace  
**Distribution Target:** Clinic PCs & Servers  

---

## TABLE OF CONTENTS
1. **System Requirements**
2. **Windows Installation Steps**
3. **MongoDB Database Installation**
4. **Electron Desktop App Wrapper Setup**
5. **Initial Startup & First Login**
6. **Backup Directories & File Locations**
7. **Database Disaster Recovery (Restore Procedure)**
8. **Printer & Receipt Customizations**
9. **Troubleshooting Clinic Nodes**

---

## 1. SYSTEM REQUIREMENTS

### Client Workstations (Dentist & Receptionist PCs)
* **Operating System:** Windows 10/11 (64-bit), macOS Catalina or newer, or Linux Ubuntu LTS.
* **Processor:** Intel Core i3 or equivalent (Intel Core i5 or newer recommended for CBCT scan inspection).
* **RAM:** 4 GB minimum (8 GB highly recommended for dual-monitor setups).
* **Storage:** 1 GB free space for local software cache (Additional space is proportional to radiographic images).

### Core Clinic Server (Local Deployment Host)
* **Operating System:** Windows Server 2019/2022, Windows 10/11 (acting as clinic node host), or Ubuntu Server LTS.
* **Database:** MongoDB Community Server v6.0+ or compatible JSON backup store.
* **NodeJS Engine:** Node.js runtime environment v18.0 or newer.

---

## 2. WINDOWS INSTALLATION STEPS

Follow these steps to deploy RK Dental Clinic Suite on a standard Windows environment:

### Step 1: Install Node.js
1. Download the official installer for **Node.js v18 LTS** or newer from `https://nodejs.org/`.
2. Launch the downloaded `.msi` file and follow the standard installation wizard.
3. Verify the installation by launching a command line (`cmd`) and running:
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Download the Clinic Source Code
1. Place the `rk-dental-clinic-suite` code folder onto a permanent location on your drive (e.g., `C:\RKDentalSuite\`).
2. Open a command line window pointing to that folder:
   ```cmd
   cd C:\RKDentalSuite
   ```

### Step 3: Package Installation
Run the following package command to download and register all system-dependent packages:
```cmd
npm install
```

---

## 3. MONGODB DATABASE INSTALLATION

To activate enterprise MongoDB features (or fallback to the robust built-in JSON system-level server engine):

1. Download **MongoDB Community Server** from `https://www.mongodb.com/try/download/community`.
2. Choose the **Complete** installation option and ensure **"Run service as Network Service user"** is checked.
3. (Optional) Install **MongoDB Compass** (the visual DB editor) when prompted by the wizard to inspect tables visually.
4. Set up your connection string inside your `.env` configuration:
   ```env
   # .env
   MONGODB_URI=mongodb://localhost:27017/rk_dental_clinic
   PORT=3000
   ```
*If a MongoDB server is not present or detected, the RK Dental Suite automatically spins up its local High-Integrity JSON Vault Database inside `/data/db-fallback.json`, making it fully operational out-of-the-box.*

---

## 4. ELECTRON DESKTOP APP WRAPPER SETUP

To run RK Dental Clinic Suite as a double-clickable native Windows desktop application with desktop shortcuts:

### Step 1: Install Desktop Components
Verify the Electron dependency is properly registered in the local package tree:
```cmd
npm install --save-dev electron
```

### Step 2: Build the Frontend assets
Create the highly-optimized clinical static build files:
```cmd
npm run build
```

### Step 3: Run the Native App in Desktop Mode
```cmd
npx electron .
```

### Step 4: Bundle as Standalone Installer (`.exe`)
To package the whole suite into a self-contained double-clickable Windows setup file:
```cmd
npm run package
```
*This uses `electron-builder` to bundle the server, frontend, and database layers into a standalone installation file inside `/dist`.*

---

## 5. INITIAL STARTUP & FIRST LOGIN

1. Launch the web application via `npm run dev` and navigate to `http://localhost:3000`, or launch the compiled Electron workspace.
2. The initial database contains pre-configured profiles for instant access.
3. Access the workstation with the default credentials:

| Role | Username | Password | Default Assigned Branch |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor` | `password` | Main Branch |
| **Receptionist** | `receptionist` | `password` | Main Branch |
| **Owner** (Full Administrator) | `owner` | `password` | System Head Office |

---

## 6. BACKUP DIRECTORIES & FILE LOCATIONS

RK Dental Clinic Suite saves records and backups in the following locations:

### 1. Embedded JSON Database Location (Fallback Mode)
* **Path:** `C:\RKDentalSuite\data\db-fallback.json` or `[projectRoot]/data/db-fallback.json`
* **File Name:** `db-fallback.json`

### 2. Digital Backups Vault (Manual & Automatic Backups)
* **Path:** `C:\RKDentalSuite\backups\` or `[projectRoot]/backups/`
* **Format:** Compressed date-stamped clinical JSON package files (e.g., `backup_2026-06-27_T10-15-22.json`).

---

## 7. DATABASE DISASTER RECOVERY (RESTORE PROCEDURE)

In the event of hardware failures or database corruption:

### How to Restore the Local Database JSON Fallback:
1. Stop any running instance of the clinic dev server or Electron app.
2. Locate the most recent healthy date-stamped backup file inside the `[projectRoot]/backups/` folder.
3. Copy that file, paste it into the `[projectRoot]/data/` directory, and rename it to exactly `db-fallback.json` (overwriting the corrupted file).
4. Restart the RK Dental Suite. The clinic records will be completely restored.

---

## 8. PRINTER & RECEIPT CUSTOMIZATIONS

The application leverages clean standard system print managers designed for regular thermal receipts and letterhead printers:

### Step 1: Set Default Printer
Ensure the printer is connected to your workstation and set as the "Default Printer" in the operating system's settings.

### Step 2: Thermal Receipt Printers (2-Inch or 3-Inch wide)
Our print windows use adaptive CSS styling:
* The system automatically formats margins and text padding to wrap cleanly within continuous roll paper.
* Ensure **"Margins: None"** and **"Header and Footers: Off"** are selected in the standard browser print dialogue box.

### Step 3: Prescription A4 Letterheads
When printing Doctor Prescriptions, the layout automatically leaves space at the top to align cleanly with pre-printed clinic letterheads.

---

## 9. TROUBLESHOOTING CLINIC NODES

### Issue: "Database Connection Failed" on Launch
* **Cause:** The MongoDB service is stopped, or the fallback path has a folder permissions issue.
* **Solution:** Ensure the local user has write access to the project root folder. If using MongoDB, open Windows Services (`services.msc`), find `MongoDB Server (MongoDB)`, and click **"Start"**.

### Issue: "Port 3000 already in use"
* **Cause:** Another instance of the application or a web server is bound to the same communication port.
* **Solution:** Close any old terminal windows, or modify the port variable inside `server.js` or `.env` and restart.

---
*(End of Document - Ready for PDF Export)*
