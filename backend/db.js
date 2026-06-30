import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

// Dynamic model cache helper for MongoDB schemaless collections
const dynamicModels = {};
function getMongoModel(collectionName) {
  if (!dynamicModels[collectionName]) {
    const schema = new mongoose.Schema({
      _id: { type: String, required: true }
    }, { strict: false, timestamps: true, id: false, versionKey: false });
    
    // Explicitly bind to the collection name in lowercase
    dynamicModels[collectionName] = mongoose.model(collectionName, schema, collectionName);
  }
  return dynamicModels[collectionName];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate secure hashes for default users
const defaultPasswordHash = bcrypt.hashSync('password', 10);

// Default static data for immediate usage
const defaultData = {
  branches: [
    {
      _id: 'branch-venpakkam',
      name: 'Venpakkam Branch (Clinic)',
      address: '12 Main Road, Venpakkam, TN',
      phone: '044-23456789',
      bedCount: 2,
      isActive: true,
    },
    {
      _id: 'branch-kalavai',
      name: 'Kalavai Branch (Clinic)',
      address: '45 Bazaar Street, Kalavai, TN',
      phone: '04172-234567',
      bedCount: 2,
      isActive: true,
    }
  ],
  users: [
    {
      _id: 'user-radhakrishnan',
      name: 'Dr. Radhakrishnan',
      username: 'radhakrishnan',
      passwordHash: bcrypt.hashSync('admin123', 10),
      role: 'owner',
      branchId: 'all',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'user-prasad',
      name: 'Dr. R.K. Prasad',
      username: 'prasad',
      passwordHash: bcrypt.hashSync('doctor123', 10),
      role: 'doctor',
      branchId: 'branch-venpakkam',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'user-priya',
      name: 'Priya',
      username: 'priya',
      passwordHash: bcrypt.hashSync('priya123', 10),
      role: 'receptionist',
      branchId: 'branch-venpakkam',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'user-sarah',
      name: 'Sarah',
      username: 'sarah',
      passwordHash: bcrypt.hashSync('sarah123', 10),
      role: 'receptionist',
      branchId: 'branch-kalavai',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  ],
  services: [
    { _id: 'svc-rct', name: 'Root Canal Treatment', category: 'Endodontics', defaultRate: 4500, taxPercent: 18, isActive: true },
    { _id: 'svc-scaling', name: 'Scaling & Polishing', category: 'Preventative', defaultRate: 1200, taxPercent: 18, isActive: true },
    { _id: 'svc-extraction', name: 'Tooth Extraction', category: 'Surgery', defaultRate: 1500, taxPercent: 18, isActive: true },
    { _id: 'svc-filling', name: 'Composite Filling', category: 'Restorative', defaultRate: 1800, taxPercent: 18, isActive: true },
    { _id: 'svc-crown', name: 'Dental Crown (Ceramic)', category: 'Prosthodontics', defaultRate: 6000, taxPercent: 18, isActive: true },
  ],
  beds: [
    { _id: 'bed-v1', branchId: 'branch-venpakkam', bedNumber: 1, label: 'Bed 1 (Venpakkam)', status: 'available', currentPatientId: null, assignedAt: null },
    { _id: 'bed-v2', branchId: 'branch-venpakkam', bedNumber: 2, label: 'Bed 2 (Venpakkam)', status: 'available', currentPatientId: null, assignedAt: null },
    { _id: 'bed-v3', branchId: 'branch-venpakkam', bedNumber: 3, label: 'Bed 3 (Venpakkam)', status: 'available', currentPatientId: null, assignedAt: null },
    { _id: 'bed-k1', branchId: 'branch-kalavai', bedNumber: 1, label: 'Bed 1 (Kalavai)', status: 'available', currentPatientId: null, assignedAt: null },
    { _id: 'bed-k2', branchId: 'branch-kalavai', bedNumber: 2, label: 'Bed 2 (Kalavai)', status: 'available', currentPatientId: null, assignedAt: null },
    { _id: 'bed-k3', branchId: 'branch-kalavai', bedNumber: 3, label: 'Bed 3 (Kalavai)', status: 'available', currentPatientId: null, assignedAt: null },
  ],
  patients: [],
  appointments: [],
  tokens: [],
  consultations: [],
  treatments: [],
  prescriptions: [],
  xrays: [],
  bills: [],
  payments: [],
  followups: [],
  auditlogs: [],
  dentalCharts: [],
  toothHistories: [],
  patientReports: [],
};

export class ClinicDB {
  constructor() {
    this.data = { ...defaultData };
    this.mongoConnected = false;

    // Load from local JSON file initially to guarantee uninterrupted offline/cached flow
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse local DB file, using defaults.', err);
      }
    }

    // Ensure all collections exist
    for (const key of Object.keys(defaultData)) {
      if (!this.data[key]) {
        this.data[key] = defaultData[key];
      }
    }

    if (this.data.beds) {
      const v3 = this.data.beds.find(b => b._id === 'bed-v3');
      if (!v3) {
        this.data.beds.push({ _id: 'bed-v3', branchId: 'branch-venpakkam', bedNumber: 3, label: 'Bed 3 (Venpakkam)', status: 'available', currentPatientId: null, assignedAt: null });
      }
      const k3 = this.data.beds.find(b => b._id === 'bed-k3');
      if (!k3) {
        this.data.beds.push({ _id: 'bed-k3', branchId: 'branch-kalavai', bedNumber: 3, label: 'Bed 3 (Kalavai)', status: 'available', currentPatientId: null, assignedAt: null });
      }
    }

    // Seed default users if empty
    this.seedDefaultUsers();

    // Initialize MongoDB Connection if URI is supplied in the environment
    if (MONGODB_URI) {
      console.log('MongoDB URI detected. Establishing connection to cluster...');
      mongoose.connect(MONGODB_URI)
        .then(() => {
          console.log('Successfully connected to MongoDB Cluster (rk_dental)!');
          this.mongoConnected = true;
          this.syncFromMongo();
        })
        .catch((err) => {
          console.error('Error connecting to MongoDB Cluster:', err);
        });
    } else {
      console.log('No MONGODB_URI found in environment. Falling back to local JSON file-based database.');
      this.saveLocal();
    }
  }

  seedDefaultUsers() {
    if (!this.data.users || this.data.users.length === 0) {
      this.data.users = [...defaultData.users];
    } else {
      const users = this.data.users;
      const required = [
        { _id: 'user-radhakrishnan', name: 'Dr. Radhakrishnan', username: 'radhakrishnan', pass: 'admin123', role: 'owner', branchId: 'all' },
        { _id: 'user-prasad', name: 'Dr. R.K. Prasad', username: 'prasad', pass: 'doctor123', role: 'doctor', branchId: 'branch-venpakkam' },
        { _id: 'user-priya', name: 'Priya', username: 'priya', pass: 'priya123', role: 'receptionist', branchId: 'branch-venpakkam' },
        { _id: 'user-sarah', name: 'Sarah', username: 'sarah', pass: 'sarah123', role: 'receptionist', branchId: 'branch-kalavai' }
      ];
      required.forEach(reqUser => {
        const found = users.find(u => u.username === reqUser.username);
        if (found) {
          found.passwordHash = bcrypt.hashSync(reqUser.pass, 10);
          found.role = reqUser.role;
          found.branchId = reqUser.branchId;
          found.name = reqUser.name;
        } else {
          users.push({
            _id: reqUser._id,
            name: reqUser.name,
            username: reqUser.username,
            passwordHash: bcrypt.hashSync(reqUser.pass, 10),
            role: reqUser.role,
            branchId: reqUser.branchId,
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  }

  async syncFromMongo() {
    try {
      console.log('Synchronising database state from MongoDB Cluster...');
      for (const colName of Object.keys(defaultData)) {
        const Model = getMongoModel(colName);
        const docs = await Model.find({}).lean();
        if (docs && docs.length > 0) {
          console.log(`Loaded ${docs.length} documents from Mongo collection: ${colName}`);
          this.data[colName] = docs;
        } else {
          // MongoDB collection is empty. Seed it from current memory data
          console.log(`Mongo collection ${colName} is empty. Seeding ${this.data[colName].length} documents...`);
          if (this.data[colName].length > 0) {
            await Model.insertMany(this.data[colName]);
          }
        }
      }
      console.log('MongoDB Synchronization successfully completed.');
      this.saveLocal();
    } catch (err) {
      console.error('Error syncing data from MongoDB:', err);
    }
  }

  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local backup database file:', err);
    }
  }

  save() {
    // 1. Persist locally first to prevent delay or offline issues
    this.saveLocal();

    // 2. Perform background synchronization to MongoDB Cluster
    if (this.mongoConnected) {
      this.syncToMongo();
    }
  }

  async syncToMongo() {
    try {
      for (const colName of Object.keys(defaultData)) {
        const Model = getMongoModel(colName);
        const localDocs = this.data[colName];

        if (localDocs.length === 0) {
          // If empty locally, clean MongoDB collection
          await Model.deleteMany({});
          continue;
        }

        // Generate bulk update operations
        const bulkOps = localDocs.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true
          }
        }));

        // Remove any documents from Mongo that no longer exist locally
        const localIds = localDocs.map(d => d._id);
        bulkOps.push({
          deleteMany: {
            filter: { _id: { $nin: localIds } }
          }
        });

        await Model.bulkWrite(bulkOps);
      }
    } catch (err) {
      console.error('Failed to save state to MongoDB Cluster:', err);
    }
  }

  getCollection(name) {
    return this.data[name];
  }

  generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const db = new ClinicDB();
