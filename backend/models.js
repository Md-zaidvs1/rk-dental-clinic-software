import mongoose, { Schema } from 'mongoose';

// ==========================================
// 1. Branch Model
// ==========================================
const BranchSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  bedCount: { type: Number, default: 2 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Branch = mongoose.model('Branch', BranchSchema);

// ==========================================
// 2. User Model
// ==========================================
const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'receptionist', 'admin'], required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);

// ==========================================
// 3. Bed Model
// ==========================================
const BedSchema = new Schema({
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  bedNumber: { type: Number, required: true },
  label: { type: String, required: true },
  status: { type: String, enum: ['available', 'occupied', 'cleaning'], default: 'available' },
  currentPatientId: { type: Schema.Types.ObjectId, ref: 'Patient', default: null },
  assignedAt: { type: Date, default: null }
}, { timestamps: true });

export const Bed = mongoose.model('Bed', BedSchema);

// ==========================================
// 4. Patient Model
// ==========================================
const PatientSchema = new Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  mobile: { type: String, required: true, unique: true },
  alternateMobile: { type: String, default: '' },
  address: { type: String, default: '' },
  occupation: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  allergies: { type: [String], default: [] },
  medicalHistory: { type: String, default: '' },
  registeredAt: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

export const Patient = mongoose.model('Patient', PatientSchema);

// ==========================================
// 5. Appointment Model
// ==========================================
const AppointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  appointmentDate: { type: Date, required: true },
  visitType: { type: String, default: 'Consultation' },
  status: { type: String, enum: ['scheduled', 'arrived', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', AppointmentSchema);

// ==========================================
// 6. Token Model
// ==========================================
const TokenSchema = new Schema({
  tokenNumber: { type: String, required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', default: null },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['waiting', 'in-consultation', 'completed', 'cancelled'], default: 'waiting' },
  calledAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

export const Token = mongoose.model('Token', TokenSchema);

// ==========================================
// 7. Treatment Model
// ==========================================
const TreatmentSchema = new Schema({
  consultationId: { type: String, required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  treatmentDate: { type: Date, default: Date.now },
  treatmentType: { type: String, required: true },
  toothNumber: { type: String, default: '' },
  notes: { type: String, default: '' },
  cost: { type: Number, required: true }
}, { timestamps: true });

export const Treatment = mongoose.model('Treatment', TreatmentSchema);

// ==========================================
// 8. Prescription Model
// ==========================================
const PrescriptionSchema = new Schema({
  consultationId: { type: String, required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  prescriptionDate: { type: Date, default: Date.now },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' }
  }],
  doctorNotes: { type: String, default: '' },
  isDraft: { type: Boolean, default: true },
  pdfPath: { type: String, default: '' },
  lastDraftAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Prescription = mongoose.model('Prescription', PrescriptionSchema);

// ==========================================
// 9. Bill Model
// ==========================================
const BillSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  consultationId: { type: String, default: '' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  lineItems: [{
    serviceId: { type: String, required: true },
    description: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'paid', 'partial', 'cancelled'], default: 'draft' },
  payments: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Bill = mongoose.model('Bill', BillSchema);

// ==========================================
// 10. Payment Model
// ==========================================
const PaymentSchema = new Schema({
  billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'upi', 'card'], required: true },
  transactionRef: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', PaymentSchema);

// ==========================================
// 11. FollowUp Model
// ==========================================
const FollowUpSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
  followUpDate: { type: Date, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' }
}, { timestamps: true });

export const FollowUp = mongoose.model('FollowUp', FollowUpSchema);

// ==========================================
// 12. AuditLog Model
// ==========================================
const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  documentId: { type: String, required: true },
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// ==========================================
// 13. DentalChart Model
// ==========================================
const DentalChartSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  toothNumber: { type: String, required: true },
  status: { type: String, required: true },
  notes: { type: String, default: '' },
  linkedReports: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const DentalChart = mongoose.model('DentalChart', DentalChartSchema);

// ==========================================
// 14. ToothHistory Model
// ==========================================
const ToothHistorySchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  toothNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
  doctor: { type: String, required: true },
  diagnosis: { type: String, default: '' },
  procedure: { type: String, default: '' },
  notes: { type: String, default: '' },
  attachments: [{ type: String }]
}, { timestamps: true });

export const ToothHistory = mongoose.model('ToothHistory', ToothHistorySchema);

// ==========================================
// 15. PatientReport Model / RadiologyFile
// ==========================================
const PatientReportSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  reportType: { type: String, required: true },
  title: { type: String, required: true },
  notes: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  fileName: { type: String, default: '' },
  uploadedBy: { type: String, required: true },
  uploadedDate: { type: Date, default: Date.now },
  branch: { type: String, default: 'Main' }
}, { timestamps: true });

export const PatientReport = mongoose.model('PatientReport', PatientReportSchema);
export const RadiologyFile = PatientReport; // Alias support

