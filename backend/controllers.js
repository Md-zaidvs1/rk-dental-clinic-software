import { db } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rk-dental-super-secret-key-12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'rk-dental-super-refresh-key-67890';

// Service Helper for DNT Patient ID Format
function generateNextPatientId() {
  const patients = db.getCollection('patients');
  const count = patients.length + 1;
  return `DNT-${String(count).padStart(6, '0')}`;
}

// Service Helper for Token Number Sequence
function generateNextTokenNumber(branchId) {
  const tokens = db.getCollection('tokens');
  const today = new Date().toISOString().split('T')[0];
  const branchTodayTokens = tokens.filter(t => t.branchId === branchId && t.date === today);
  const nextSeq = branchTodayTokens.length + 1;
  return `T${String(nextSeq).padStart(3, '0')}`;
}

// Service Helper for Invoice Number Sequence
function generateNextInvoiceNumber() {
  const bills = db.getCollection('bills');
  const count = bills.length + 1;
  return `INV-${String(count).padStart(6, '0')}`;
}

// Logging Helper for Audit Logs
function writeAuditLog(userId, action, module, docId, before, after, branchId) {
  const auditlogs = db.getCollection('auditlogs');
  const log = {
    _id: db.generateId('log'),
    userId,
    action,
    module,
    documentId: docId,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    branchId,
    createdAt: new Date().toISOString(),
  };
  auditlogs.push(log);
  db.save();
}

// Auth Middleware Verification helper
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// --- Controller Handlers ---

export const AuthController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const users = db.getCollection('users');
      const user = users.find(u => u.username === username && u.isActive);

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid username or password' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid username or password' });
      }

      const payload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      writeAuditLog(user._id, 'LOGIN', 'auth', user._id, null, { username: user.username }, user.branchId);

      return res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: payload
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  me: (req, res) => {
    const users = db.getCollection('users');
    const user = users.find(u => u._id === req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
      }
    });
  }
};

export const PatientController = {
  register: (req, res) => {
    try {
      const { name, age, gender, mobile, alternateMobile, address, occupation, bloodGroup, allergies, medicalHistory } = req.body;
      const patients = db.getCollection('patients');

      // Check for duplicate mobile
      if (patients.some(p => p.mobile === mobile)) {
        return res.status(400).json({ success: false, message: 'A patient with this mobile number already exists' });
      }

      const patientId = generateNextPatientId();
      const newPatient = {
        _id: db.generateId('pat'),
        patientId,
        name,
        age: Number(age),
        gender,
        mobile,
        alternateMobile: alternateMobile || '',
        address: address || '',
        occupation: occupation || '',
        bloodGroup: bloodGroup || '',
        allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
        medicalHistory: medicalHistory || '',
        registeredAt: req.user.branchId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      patients.push(newPatient);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'patient', newPatient._id, null, newPatient, req.user.branchId);

      return res.status(201).json({ success: true, data: newPatient });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  list: (req, res) => {
    const patients = db.getCollection('patients');
    return res.json({ success: true, data: patients });
  },

  search: (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const patients = db.getCollection('patients');
    const query = String(q).toLowerCase();

    const filtered = patients.filter(p => 
      p.patientId.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.mobile.includes(query)
    );

    return res.json({ success: true, data: filtered });
  },

  getProfile: (req, res) => {
    const { id } = req.params;
    const patients = db.getCollection('patients');
    const patient = patients.find(p => p._id === id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Load full details
    const consultations = db.getCollection('consultations').filter(c => c.patientId === id);
    const prescriptions = db.getCollection('prescriptions').filter(p => p.patientId === id);
    const bills = db.getCollection('bills').filter(b => b.patientId === id);
    const xrays = db.getCollection('xrays').filter(x => x.patientId === id);

    return res.json({
      success: true,
      data: {
        patient,
        history: {
          consultations,
          prescriptions,
          bills,
          xrays
        }
      }
    });
  }
};

export const AppointmentController = {
  create: (req, res) => {
    try {
      const { patientId, appointmentDate, visitType, notes } = req.body;
      const appointments = db.getCollection('appointments');

      const appt = {
        _id: db.generateId('appt'),
        patientId,
        doctorId: 'user-doctor', // assigned to main doctor
        branchId: req.user.branchId,
        appointmentDate,
        visitType,
        status: 'scheduled',
        notes: notes || '',
        createdBy: req.user._id,
        createdAt: new Date().toISOString(),
      };

      appointments.push(appt);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'appointment', appt._id, null, appt, req.user.branchId);

      return res.status(201).json({ success: true, data: appt });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  list: (req, res) => {
    const appointments = db.getCollection('appointments');
    const patients = db.getCollection('patients');
    const branchId = req.user.branchId;

    // Filter by branch
    const branchAppts = appointments.filter(a => a.branchId === branchId);

    // Map patient details
    const enriched = branchAppts.map(a => ({
      ...a,
      patient: patients.find(p => p._id === a.patientId)
    }));

    return res.json({ success: true, data: enriched });
  },

  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointments = db.getCollection('appointments');
      const appt = appointments.find(a => a._id === id);

      if (!appt) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      const before = { ...appt };
      appt.status = status;
      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'appointment', appt._id, before, appt, req.user.branchId);

      return res.json({ success: true, data: appt });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const QueueController = {
  generateToken: (req, res) => {
    try {
      const { patientId, appointmentId } = req.body;
      const tokens = db.getCollection('tokens');
      const today = new Date().toISOString().split('T')[0];

      const tokenNumber = generateNextTokenNumber(req.user.branchId);

      const newToken = {
        _id: db.generateId('tok'),
        tokenNumber,
        patientId,
        appointmentId: appointmentId || null,
        branchId: req.user.branchId,
        date: today,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      tokens.push(newToken);
      db.save();

      // If tied to appointment, mark appointment as 'arrived'
      if (appointmentId) {
        const appts = db.getCollection('appointments');
        const appt = appts.find(a => a._id === appointmentId);
        if (appt) {
          appt.status = 'arrived';
          db.save();
        }
      }

      writeAuditLog(req.user._id, 'CREATE', 'token', newToken._id, null, newToken, req.user.branchId);

      return res.status(201).json({ success: true, data: newToken });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getQueue: (req, res) => {
    const tokens = db.getCollection('tokens');
    const patients = db.getCollection('patients');
    const today = new Date().toISOString().split('T')[0];

    const todayQueue = tokens.filter(t => t.branchId === req.user.branchId && t.date === today);
    const enriched = todayQueue.map(t => ({
      ...t,
      patient: patients.find(p => p._id === t.patientId)
    }));

    return res.json({ success: true, data: enriched });
  },

  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tokens = db.getCollection('tokens');
      const tok = tokens.find(t => t._id === id);

      if (!tok) {
        return res.status(404).json({ success: false, message: 'Token not found' });
      }

      const before = { ...tok };
      tok.status = status;

      if (status === 'in-consultation') {
        tok.calledAt = new Date().toISOString();
      } else if (status === 'completed') {
        tok.completedAt = new Date().toISOString();
      }

      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'token', tok._id, before, tok, req.user.branchId);

      return res.json({ success: true, data: tok });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const BedController = {
  list: (req, res) => {
    const beds = db.getCollection('beds');
    const patients = db.getCollection('patients');
    const branchBeds = beds.filter(b => b.branchId === req.user.branchId);

    const enriched = branchBeds.map(b => ({
      ...b,
      patient: b.currentPatientId ? patients.find(p => p._id === b.currentPatientId) : null
    }));

    return res.json({ success: true, data: enriched });
  },

  allocate: (req, res) => {
    try {
      const { id } = req.params;
      const { patientId } = req.body;
      const beds = db.getCollection('beds');
      const bed = beds.find(b => b._id === id);

      if (!bed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }

      const before = { ...bed };
      bed.status = 'occupied';
      bed.currentPatientId = patientId;
      bed.assignedAt = new Date().toISOString();
      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'bed', bed._id, before, bed, req.user.branchId);

      return res.json({ success: true, data: bed });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  release: (req, res) => {
    try {
      const { id } = req.params;
      const beds = db.getCollection('beds');
      const bed = beds.find(b => b._id === id);

      if (!bed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }

      const before = { ...bed };
      bed.status = 'cleaning';
      bed.currentPatientId = null;
      bed.assignedAt = null;
      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'bed', bed._id, before, bed, req.user.branchId);

      return res.json({ success: true, data: bed });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const beds = db.getCollection('beds');
      const bed = beds.find(b => b._id === id);

      if (!bed) {
        return res.status(404).json({ success: false, message: 'Bed not found' });
      }

      const before = { ...bed };
      bed.status = status;
      if (status === 'available') {
        bed.currentPatientId = null;
        bed.assignedAt = null;
      }
      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'bed', bed._id, before, bed, req.user.branchId);

      return res.json({ success: true, data: bed });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const ConsultationController = {
  create: (req, res) => {
    try {
      const { patientId, chiefComplaint, symptoms, diagnosis, findings, treatmentPlan, notes, tokenId, bedId } = req.body;
      const consultations = db.getCollection('consultations');

      const consult = {
        _id: db.generateId('consult'),
        patientId,
        doctorId: req.user._id,
        branchId: req.user.branchId,
        visitDate: new Date().toISOString(),
        chiefComplaint,
        symptoms: symptoms || '',
        diagnosis: diagnosis || '',
        findings: findings || '',
        treatmentPlan: treatmentPlan || '',
        notes: notes || '',
        tokenId: tokenId || null,
        bedId: bedId || null,
        createdAt: new Date().toISOString(),
      };

      consultations.push(consult);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'consultation', consult._id, null, consult, req.user.branchId);

      return res.status(201).json({ success: true, data: consult });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getById: (req, res) => {
    const { id } = req.params;
    const consultations = db.getCollection('consultations');
    const consult = consultations.find(c => c._id === id);

    if (!consult) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const patients = db.getCollection('patients');
    const prescriptions = db.getCollection('prescriptions').filter(p => p.consultationId === id);
    const treatments = db.getCollection('treatments').filter(t => t.consultationId === id);

    return res.json({
      success: true,
      data: {
        ...consult,
        patient: patients.find(p => p._id === consult.patientId),
        prescriptions,
        treatments
      }
    });
  }
};

export const PrescriptionController = {
  saveDraft: (req, res) => {
    try {
      const { consultationId, patientId, medicines, doctorNotes, isDraft } = req.body;
      const prescriptions = db.getCollection('prescriptions');

      // Check if a draft or prescription already exists for this consultation
      let rx = prescriptions.find(p => p.consultationId === consultationId);

      const today = new Date().toISOString();

      if (rx) {
        const before = { ...rx };
        rx.medicines = medicines;
        rx.doctorNotes = doctorNotes || '';
        rx.isDraft = isDraft !== undefined ? isDraft : true;
        rx.lastDraftAt = today;
        db.save();
        writeAuditLog(req.user._id, 'UPDATE', 'prescription', rx._id, before, rx, req.user.branchId);
      } else {
        rx = {
          _id: db.generateId('rx'),
          consultationId,
          patientId,
          doctorId: req.user._id,
          branchId: req.user.branchId,
          prescriptionDate: today,
          medicines,
          doctorNotes: doctorNotes || '',
          isDraft: isDraft !== undefined ? isDraft : true,
          pdfPath: '',
          lastDraftAt: today,
        };
        prescriptions.push(rx);
        db.save();
        writeAuditLog(req.user._id, 'CREATE', 'prescription', rx._id, null, rx, req.user.branchId);
      }

      return res.json({ success: true, data: rx });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  finalize: (req, res) => {
    try {
      const { id } = req.params;
      const prescriptions = db.getCollection('prescriptions');
      const rx = prescriptions.find(p => p._id === id);

      if (!rx) {
        return res.status(404).json({ success: false, message: 'Prescription not found' });
      }

      const before = { ...rx };
      rx.isDraft = false;
      // Simulate PDF path generation
      rx.pdfPath = `uploads/prescriptions/2026/06/${id}.pdf`;
      db.save();

      writeAuditLog(req.user._id, 'FINALIZE', 'prescription', rx._id, before, rx, req.user.branchId);

      return res.json({ success: true, data: rx });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const TreatmentController = {
  create: (req, res) => {
    try {
      const { consultationId, patientId, treatmentType, toothNumber, notes, cost } = req.body;
      const treatments = db.getCollection('treatments');

      const treat = {
        _id: db.generateId('treat'),
        consultationId,
        patientId,
        doctorId: req.user._id,
        branchId: req.user.branchId,
        treatmentDate: new Date().toISOString(),
        treatmentType,
        toothNumber: toothNumber || '',
        notes: notes || '',
        cost: Number(cost),
      };

      treatments.push(treat);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'treatment', treat._id, null, treat, req.user.branchId);

      return res.status(201).json({ success: true, data: treat });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  listByConsultation: (req, res) => {
    const { consultationId } = req.query;
    const treatments = db.getCollection('treatments');
    const filtered = treatments.filter(t => t.consultationId === consultationId);
    return res.json({ success: true, data: filtered });
  }
};

export const BillingController = {
  createBill: (req, res) => {
    try {
      const { patientId, consultationId, lineItems, discountAmount, taxAmount } = req.body;
      const bills = db.getCollection('bills');

      const invoiceNumber = generateNextInvoiceNumber();

      const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
      const totalAmount = subtotal - (discountAmount || 0) + (taxAmount || 0);

      const bill = {
        _id: db.generateId('bill'),
        invoiceNumber,
        patientId,
        consultationId,
        branchId: req.user.branchId,
        lineItems,
        subtotal,
        discountAmount: discountAmount || 0,
        taxAmount: taxAmount || 0,
        totalAmount,
        status: 'draft',
        payments: [],
        createdBy: req.user._id,
        createdAt: new Date().toISOString(),
      };

      bills.push(bill);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'bill', bill._id, null, bill, req.user.branchId);

      return res.status(201).json({ success: true, data: bill });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getById: (req, res) => {
    const { id } = req.params;
    const bills = db.getCollection('bills');
    const patients = db.getCollection('patients');
    const payments = db.getCollection('payments');

    const bill = bills.find(b => b._id === id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    return res.json({
      success: true,
      data: {
        ...bill,
        patient: patients.find(p => p._id === bill.patientId),
        paymentHistory: payments.filter(p => p.billId === id)
      }
    });
  },

  recordPayment: (req, res) => {
    try {
      const { billId, amount, paymentMode, transactionRef } = req.body;
      const payments = db.getCollection('payments');
      const bills = db.getCollection('bills');

      const bill = bills.find(b => b._id === billId);
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Bill not found' });
      }

      const pay = {
        _id: db.generateId('pay'),
        billId,
        patientId: bill.patientId,
        branchId: req.user.branchId,
        amount: Number(amount),
        paymentMode,
        transactionRef: transactionRef || '',
        paidAt: new Date().toISOString(),
        collectedBy: req.user._id,
      };

      payments.push(pay);

      // Recalculate bill payment status
      const totalPaid = payments
        .filter(p => p.billId === billId)
        .reduce((sum, p) => sum + p.amount, 0);

      const before = { ...bill };
      if (totalPaid >= bill.totalAmount) {
        bill.status = 'paid';
      } else if (totalPaid > 0) {
        bill.status = 'partial';
      }
      bill.payments.push(pay._id);

      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'payment', pay._id, null, pay, req.user.branchId);
      writeAuditLog(req.user._id, 'UPDATE', 'bill', bill._id, before, bill, req.user.branchId);

      return res.status(201).json({ success: true, data: pay });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  listServices: (req, res) => {
    const services = db.getCollection('services');
    return res.json({ success: true, data: services });
  }
};

export const ReportController = {
  getDailySummary: (req, res) => {
    const patients = db.getCollection('patients');
    const consultations = db.getCollection('consultations');
    const bills = db.getCollection('bills');
    const branchId = req.user.branchId;

    // Filter by branch
    const branchConsults = consultations.filter(c => c.branchId === branchId);
    const branchBills = bills.filter(b => b.branchId === branchId);

    // Compute simple dashboard aggregates
    const dailyPatientsCount = patients.length;
    const dailyConsultsCount = branchConsults.length;
    const dailyRevenue = branchBills
      .filter(b => b.status === 'paid' || b.status === 'partial')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Dynamic analytics chart data points (7 days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const cCount = consultations.filter(c => c.branchId === branchId && c.visitDate.startsWith(dateStr)).length;
      const revenue = bills
        .filter(b => b.branchId === branchId && b.createdAt.startsWith(dateStr) && (b.status === 'paid' || b.status === 'partial'))
        .reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        date: dateStr,
        consultations: cCount,
        revenue
      };
    }).reverse();

    return res.json({
      success: true,
      data: {
        totalPatients: dailyPatientsCount,
        totalConsultations: dailyConsultsCount,
        totalRevenue: dailyRevenue,
        chartData
      }
    });
  }
};

export const FollowUpController = {
  create: (req, res) => {
    try {
      const { patientId, followUpDate, notes } = req.body;
      const followups = db.getCollection('followups');

      const followUp = {
        _id: db.generateId('fup'),
        patientId,
        doctorId: req.user._id,
        branchId: req.user.branchId,
        followUpDate,
        notes: notes || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      followups.push(followUp);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'followup', followUp._id, null, followUp, req.user.branchId);

      return res.status(201).json({ success: true, data: followUp });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  list: (req, res) => {
    try {
      const followups = db.getCollection('followups');
      const patients = db.getCollection('patients');
      const branchId = req.user.branchId;

      // Filter by branch
      const branchFollowups = followups.filter(f => f.branchId === branchId);

      // Enrich with patient details
      const enriched = branchFollowups.map(f => ({
        ...f,
        patient: patients.find(p => p._id === f.patientId)
      }));

      return res.json({ success: true, data: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateStatus: (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const followups = db.getCollection('followups');
      const followUp = followups.find(f => f._id === id);

      if (!followUp) {
        return res.status(404).json({ success: false, message: 'Follow-Up not found' });
      }

      const before = { ...followUp };
      followUp.status = status;
      db.save();

      writeAuditLog(req.user._id, 'UPDATE', 'followup', followUp._id, before, followUp, req.user.branchId);

      return res.json({ success: true, data: followUp });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const UserController = {
  list: (req, res) => {
    try {
      const users = db.getCollection('users');
      const safeUsers = users.map(u => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        role: u.role,
        branchId: u.branchId,
        isActive: u.isActive !== false,
        createdAt: u.createdAt
      }));
      return res.json({ success: true, data: safeUsers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, username, password, role, branchId } = req.body;
      const users = db.getCollection('users');

      if (users.some(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }

      const passwordHash = await bcrypt.hash(password || 'password', 10);
      const newUser = {
        _id: db.generateId('user'),
        name,
        username,
        passwordHash,
        role,
        branchId,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      db.save();

      writeAuditLog(req.user._id, 'CREATE', 'user', newUser._id, null, { username }, req.user.branchId);

      return res.status(201).json({
        success: true,
        data: {
          _id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          branchId: newUser.branchId,
          isActive: newUser.isActive
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, branchId, password } = req.body;
      const users = db.getCollection('users');
      const user = users.find(u => u._id === id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const before = { ...user };
      if (name) user.name = name;
      if (role) user.role = role;
      if (branchId) user.branchId = branchId;
      if (password) {
        user.passwordHash = await bcrypt.hash(password, 10);
      }

      db.save();
      writeAuditLog(req.user._id, 'UPDATE', 'user', user._id, before, { username: user.username }, req.user.branchId);

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          branchId: user.branchId,
          isActive: user.isActive
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  toggleStatus: (req, res) => {
    try {
      const { id } = req.params;
      const users = db.getCollection('users');
      const user = users.find(u => u._id === id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const before = { ...user };
      user.isActive = user.isActive === false ? true : false;
      db.save();

      writeAuditLog(req.user._id, 'TOGGLE_STATUS', 'user', user._id, before, { username: user.username, isActive: user.isActive }, req.user.branchId);

      return res.json({
        success: true,
        data: {
          _id: user._id,
          isActive: user.isActive
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const BackupController = {
  triggerBackup: (req, res) => {
    try {
      const DATA_DIR = path.join(process.cwd(), 'data');
      const BACKUP_DIR = path.join(DATA_DIR, 'backups');
      const DB_FILE = path.join(DATA_DIR, 'db.json');

      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.json`;
      const backupFilePath = path.join(BACKUP_DIR, backupFileName);

      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, backupFilePath);
        const stats = fs.statSync(backupFilePath);
        const fileSizeInMegabytes = (stats.size / (1024 * 1024)).toFixed(2);

        writeAuditLog(req.user._id, 'BACKUP', 'system', 'db', null, { file: backupFileName }, req.user.branchId);

        return res.json({
          success: true,
          data: {
            date: new Date().toISOString().split('T')[0],
            status: 'Success',
            size: `${fileSizeInMegabytes} MB`,
            location: `Local Storage Backup (${backupFileName})`
          }
        });
      } else {
        return res.status(404).json({ success: false, message: 'Database file not found to back up' });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  listBackups: (req, res) => {
    try {
      const DATA_DIR = path.join(process.cwd(), 'data');
      const BACKUP_DIR = path.join(DATA_DIR, 'backups');

      if (!fs.existsSync(BACKUP_DIR)) {
        return res.json({ success: true, data: [] });
      }

      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(f => {
          const filePath = path.join(BACKUP_DIR, f);
          const stats = fs.statSync(filePath);
          const fileSizeInMegabytes = (stats.size / (1024 * 1024)).toFixed(2);
          
          // extract date
          const parts = f.replace('backup-', '').replace('.json', '').split('T');
          const date = parts[0] || new Date().toISOString().split('T')[0];

          return {
            date,
            status: 'Success',
            size: `${fileSizeInMegabytes} MB`,
            location: `Local Storage Backup (${f})`
          };
        });

      return res.json({ success: true, data: files });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const DentalChartController = {
  getChartAndHistory: (req, res) => {
    try {
      const { id } = req.params;
      const dentalCharts = db.getCollection('dentalCharts') || [];
      const toothHistories = db.getCollection('toothHistories') || [];

      const patientChart = dentalCharts.filter(c => c.patientId === id);
      const patientHistory = toothHistories.filter(h => h.patientId === id);

      return res.json({
        success: true,
        chart: patientChart,
        history: patientHistory
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateTooth: (req, res) => {
    try {
      const { id } = req.params;
      const { toothNumber, status, notes, reportId } = req.body;
      const dentalCharts = db.getCollection('dentalCharts') || [];
      const toothHistories = db.getCollection('toothHistories') || [];

      let chartEntry = dentalCharts.find(c => c.patientId === id && c.toothNumber === String(toothNumber));
      const before = chartEntry ? JSON.parse(JSON.stringify(chartEntry)) : null;

      if (chartEntry) {
        chartEntry.status = status;
        chartEntry.notes = notes || '';
        chartEntry.updatedAt = new Date().toISOString();
        chartEntry.updatedBy = req.user._id;
        if (reportId) {
          if (!chartEntry.linkedReports) chartEntry.linkedReports = [];
          if (!chartEntry.linkedReports.includes(reportId)) {
            chartEntry.linkedReports.push(reportId);
          }
        }
      } else {
        chartEntry = {
          _id: db.generateId('chart'),
          patientId: id,
          toothNumber: String(toothNumber),
          status,
          notes: notes || '',
          linkedReports: reportId ? [reportId] : [],
          updatedAt: new Date().toISOString(),
          updatedBy: req.user._id
        };
        dentalCharts.push(chartEntry);
      }

      // Automatically log to toothHistories
      const historyEntry = {
        _id: db.generateId('thist'),
        patientId: id,
        toothNumber: String(toothNumber),
        date: new Date().toISOString(),
        doctor: req.user.name || 'Clinical Specialist',
        diagnosis: status,
        procedure: status === 'Healthy' ? 'Observation' : `${status} Procedure`,
        notes: notes || `Tooth status updated to ${status}.`,
        attachments: reportId ? [reportId] : []
      };
      toothHistories.push(historyEntry);

      db.save();
      writeAuditLog(req.user._id, 'UPDATE_TOOTH', 'dentalChart', chartEntry._id, before, chartEntry, req.user.branchId);

      return res.json({
        success: true,
        chartEntry,
        historyEntry
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  addToothHistory: (req, res) => {
    try {
      const { id } = req.params;
      const { toothNumber, diagnosis, procedure, notes, attachments } = req.body;
      const toothHistories = db.getCollection('toothHistories') || [];

      const historyEntry = {
        _id: db.generateId('thist'),
        patientId: id,
        toothNumber: String(toothNumber),
        date: new Date().toISOString(),
        doctor: req.user.name || 'Clinical Specialist',
        diagnosis: diagnosis || '',
        procedure: procedure || 'Observation',
        notes: notes || '',
        attachments: attachments || []
      };
      toothHistories.push(historyEntry);

      db.save();
      writeAuditLog(req.user._id, 'ADD_TOOTH_HISTORY', 'toothHistory', historyEntry._id, null, historyEntry, req.user.branchId);

      return res.status(201).json({
        success: true,
        data: historyEntry
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export const RadiologyController = {
  listReports: (req, res) => {
    try {
      const { id } = req.params;
      const patientReports = db.getCollection('patientReports') || [];
      const patientData = patientReports.filter(r => r.patientId === id);

      return res.json({
        success: true,
        data: patientData
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  uploadReport: (req, res) => {
    try {
      const { id } = req.params;
      const { reportType, title, notes, fileData, fileName, branch } = req.body;
      const patientReports = db.getCollection('patientReports') || [];

      if (!fileData) {
        return res.status(400).json({ success: false, message: 'File payload is required.' });
      }

      const reportEntry = {
        _id: db.generateId('rep'),
        patientId: id,
        reportType: reportType || 'RVG',
        title: title || `${reportType} scan`,
        notes: notes || '',
        fileUrl: fileData, // Store Base64 directly for flawless portability
        fileName: fileName || 'radiology_scan.png',
        uploadedBy: req.user.name || 'Radiologist',
        uploadedDate: new Date().toISOString(),
        branch: branch || 'Main Clinic'
      };

      patientReports.push(reportEntry);
      db.save();

      writeAuditLog(req.user._id, 'UPLOAD_RADIOLOGY', 'radiology', reportEntry._id, null, reportEntry, req.user.branchId);

      return res.status(201).json({
        success: true,
        data: reportEntry
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  deleteReport: (req, res) => {
    try {
      const { id, reportId } = req.params;
      const patientReports = db.getCollection('patientReports') || [];
      const idx = patientReports.findIndex(r => r._id === reportId && r.patientId === id);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const deleted = patientReports.splice(idx, 1)[0];

      // Clean up linked reports in dentalCharts
      const dentalCharts = db.getCollection('dentalCharts') || [];
      dentalCharts.forEach(c => {
        if (c.linkedReports && c.linkedReports.includes(reportId)) {
          c.linkedReports = c.linkedReports.filter(rid => rid !== reportId);
        }
      });

      db.save();
      writeAuditLog(req.user._id, 'DELETE_RADIOLOGY', 'radiology', reportId, deleted, null, req.user.branchId);

      return res.json({
        success: true,
        message: 'Radiology report successfully deleted'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  updateReportNotes: (req, res) => {
    try {
      const { id, reportId } = req.params;
      const { notes } = req.body;
      const patientReports = db.getCollection('patientReports') || [];

      const report = patientReports.find(r => r._id === reportId && r.patientId === id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      const before = JSON.parse(JSON.stringify(report));
      report.notes = notes || '';
      report.updatedAt = new Date().toISOString();

      db.save();
      writeAuditLog(req.user._id, 'UPDATE_RADIOLOGY_NOTES', 'radiology', reportId, before, report, req.user.branchId);

      return res.json({
        success: true,
        message: 'Report notes successfully updated'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};


