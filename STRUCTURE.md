# RK Dental Clinic - Complete Project Folder Structure

This document maps out the complete modular architecture of the RK Dental Clinic software across Backend, Frontend, and Electron layers.

```text
rk-dental/
├── .env.example              # Development environment configurations
├── .gitignore                # Node and distribution build ignore maps
├── index.html                # Single-page web entrypoint
├── metadata.json             # AI Studio applet permissions and metadata
├── package.json              # Monorepo dependencies and automated run scripts
├── tsconfig.json             # TypeScript compiler rules
├── vite.config.ts            # Vite asset pipeline configuration
├── server.ts                 # Full-stack Node.js server entrypoint
│
├── backend/                  # Full-Stack API Server
│   ├── db.ts                 # SQLite/JSON database fallbacks and MongoDB connections
│   ├── routes.ts             # REST router endpoint declarations
│   └── controllers.ts        # Business controllers (Auth, Patient, Beds, Billing, Queue)
│
├── electron/                 # Electron Desktop Wrapper
│   ├── main.js               # Desktop main thread and Window manager
│   ├── preload.js            # Secure IPC sandbox bridge
│   ├── ipc/                  # Native OS system handlers
│   │   ├── print.js          # Native dental letterpad hardware printing
│   │   ├── files.js          # Local patient X-Ray directory viewer
│   │   └── backup.js         # Daily database cron backups
│   └── icons/                # System application icons
│
└── src/                      # Frontend Client (React 19 + Tailwind CSS)
    ├── main.tsx              # React mounting root
    ├── App.tsx               # Main app layout, routing, and role-based guards
    ├── index.css             # Tailwind and Font imports
    │
    ├── store/                # Zustand client-side persistent state stores
    │   └── authStore.ts      # Authentication tokens and clinical branch states
    │
    └── components/           # Reusable UI controls
        └── Dashboard.tsx     # Rich charts, patient trends, daily queue, and revenue reports
```
