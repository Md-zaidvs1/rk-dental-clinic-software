import { Router } from 'express';
import { 
  AuthController, 
  PatientController, 
  AppointmentController, 
  QueueController, 
  BedController, 
  ConsultationController, 
  PrescriptionController, 
  TreatmentController, 
  BillingController, 
  ReportController,
  FollowUpController,
  UserController,
  BackupController,
  DentalChartController,
  RadiologyController,
  verifyToken
} from './controllers.js';

export const apiRouter = Router();

// Auth Routes
apiRouter.post('/auth/login', AuthController.login);
apiRouter.get('/auth/me', verifyToken, AuthController.me);

// User Management Routes
apiRouter.get('/users', verifyToken, UserController.list);
apiRouter.post('/users', verifyToken, UserController.create);
apiRouter.put('/users/:id', verifyToken, UserController.update);
apiRouter.patch('/users/:id/status', verifyToken, UserController.toggleStatus);

// Patient Routes
apiRouter.post('/patients', verifyToken, PatientController.register);
apiRouter.get('/patients', verifyToken, PatientController.list);
apiRouter.get('/patients/search', verifyToken, PatientController.search);
apiRouter.get('/patients/:id', verifyToken, PatientController.getProfile);

// Appointment Routes
apiRouter.post('/appointments', verifyToken, AppointmentController.create);
apiRouter.get('/appointments', verifyToken, AppointmentController.list);
apiRouter.patch('/appointments/:id/status', verifyToken, AppointmentController.updateStatus);

// Queue / Token Routes
apiRouter.post('/tokens', verifyToken, QueueController.generateToken);
apiRouter.get('/tokens/queue', verifyToken, QueueController.getQueue);
apiRouter.patch('/tokens/:id/status', verifyToken, QueueController.updateStatus);

// Bed Allocation Routes
apiRouter.get('/beds', verifyToken, BedController.list);
apiRouter.post('/beds/:id/allocate', verifyToken, BedController.allocate);
apiRouter.post('/beds/:id/release', verifyToken, BedController.release);
apiRouter.patch('/beds/:id/status', verifyToken, BedController.updateStatus);

// Consultation Routes
apiRouter.post('/consultations', verifyToken, ConsultationController.create);
apiRouter.get('/consultations/:id', verifyToken, ConsultationController.getById);

// Prescription Routes
apiRouter.post('/prescriptions', verifyToken, PrescriptionController.saveDraft);
apiRouter.post('/prescriptions/:id/finalize', verifyToken, PrescriptionController.finalize);

// Treatment Routes
apiRouter.post('/treatments', verifyToken, TreatmentController.create);
apiRouter.get('/treatments', verifyToken, TreatmentController.listByConsultation);

// Billing Routes
apiRouter.post('/bills', verifyToken, BillingController.createBill);
apiRouter.get('/bills/:id', verifyToken, BillingController.getById);
apiRouter.post('/payments', verifyToken, BillingController.recordPayment);
apiRouter.get('/services', verifyToken, BillingController.listServices);

// Follow-Up Routes
apiRouter.post('/followups', verifyToken, FollowUpController.create);
apiRouter.get('/followups', verifyToken, FollowUpController.list);
apiRouter.patch('/followups/:id/status', verifyToken, FollowUpController.updateStatus);

// Report Routes
apiRouter.get('/reports/dashboard', verifyToken, ReportController.getDailySummary);

// Backup Routes
apiRouter.post('/backups/trigger', verifyToken, BackupController.triggerBackup);
apiRouter.get('/backups', verifyToken, BackupController.listBackups);

// Dental Chart & History Routes
apiRouter.get('/patients/:id/dental-chart', verifyToken, DentalChartController.getChartAndHistory);
apiRouter.post('/patients/:id/dental-chart', verifyToken, DentalChartController.updateTooth);
apiRouter.post('/patients/:id/tooth-history', verifyToken, DentalChartController.addToothHistory);

// Radiology Reports / RVG Routes
apiRouter.get('/patients/:id/reports', verifyToken, RadiologyController.listReports);
apiRouter.post('/patients/:id/reports', verifyToken, RadiologyController.uploadReport);
apiRouter.delete('/patients/:id/reports/:reportId', verifyToken, RadiologyController.deleteReport);
apiRouter.put('/patients/:id/reports/:reportId/notes', verifyToken, RadiologyController.updateReportNotes);

