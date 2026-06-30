# RK Dental Clinic Medical Suite - Installation & Operations Guide

This guide describes how to configure, run, compile, and bundle the **RK Dental Clinic Desktop Software** in both standard web mode and native desktop container wrapping (Electron).

---

## 🚀 1. Local Development Quickstart

### Prerequisites
- **Node.js**: v18.0 or newer (v20+ recommended)
- **npm**: v9.0 or newer

### Step 1: Clone and Install Workspace Dependencies
Clone the repository and install all node packages:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the template variables file and fill in your custom keys (or leave as-is to use the robust local JSON database fallback):
```bash
cp .env.example .env
```

### Step 3: Launch Local Full-Stack Dev Server
Run the dev task to start the Express API backend, mounting the Vite development middleware on Port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to access the clinical workdesk.

---

## 💻 2. Electron Desktop Mode Setup

To load the clinical workspace within a secure native OS desktop container wrapper using Electron:

### Step 1: Install Electron packages
Ensure electron and developer tools are present in your workspace:
```bash
npm install --save-dev electron
```

### Step 2: Running Electron in Development
In a new terminal window, with the dev server running (`npm run dev`), launch the Electron application wrapper:
```bash
npx electron .
```

---

## 📦 3. Compiling and Packaging for Distribution

To bundle the application into a standalone standalone installer executable (`.exe` for Windows, `.dmg` for Mac):

### Step 1: Compile Production Builds
Compile the static React frontend and package the backend into a single bundled ES-Module server file:
```bash
npm run build
```

### Step 2: Package with Electron Builder
Generate native distribution installers:
```bash
# Package for the active platform
npx electron-builder

# Explicit build targets
npx electron-builder --win --x64
npx electron-builder --mac
```
The finished installers will be located in the `/dist` directory.

---

## 🔒 4. Production Security Guidelines
1. **Context Isolation**: Keep `contextIsolation: true` and `nodeIntegration: false` in `/electron/main.js` to safeguard clinic records from scripting injections.
2. **Access Controls**: Ensure default login credentials (`doctor` / `receptionist`) are rotated before deploying to active clinic PCs.
