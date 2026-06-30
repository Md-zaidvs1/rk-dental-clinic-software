import React, { useState, useEffect } from 'react';
import { Search, Check, Trash2, Plus, Printer, PlusCircle } from 'lucide-react';
import AdvancedDentalChart from './AdvancedDentalChart.jsx';

const COMMON_DRUGS = [
  'Amoxicillin 500mg',
  'Paracetamol 650mg',
  'Metronidazole 400mg',
  'Ibuprofen 400mg',
  'Clindamycin 300mg',
  'Ciprofloxacin 500mg',
  'Ketorolac 10mg (DT)',
  'Amoxicillin + Clavulanate 625mg',
  'Chlohexidine Mouthwash (0.2%)',
  'Pantoprazole 40mg'
];

export default function DoctorWorkspace({
  token,
  user,
  activePatientFromDashboard,
  activeTokenFromDashboard,
  onConsultationFinished
}) {
  // Active session details
  const [activePatient, setActivePatient] = useState(null);
  const [activeToken, setActiveToken] = useState(null);

  // Search input states for Doctor desk
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Clinical Consultation parameters
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');

  // Dental treatments list to record
  const [treatmentType, setTreatmentType] = useState('Root Canal Treatment');
  const [toothNumber, setToothNumber] = useState('');
  const [treatmentCost, setTreatmentCost] = useState('4500');
  const [addedTreatments, setAddedTreatments] = useState([]);

  // Prescription medicines
  const [medicines, setMedicines] = useState([
    { name: 'Amoxicillin 500mg', dosage: '1 tab', frequency: 'Three times daily', duration: '5 days', instructions: 'After food' }
  ]);

  // Drug Autocomplete focus tracking
  const [focusedMedIndex, setFocusedMedIndex] = useState(null);

  // States for indicators
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);
  const [activePrescriptionId, setActivePrescriptionId] = useState(null);
  const [finalizedPrescription, setFinalizedPrescription] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Doctor Analytics Board State and Fetching
  const [analytics, setAnalytics] = useState({ todayQueue: 0, completedYesterday: 0, upcomingPending: 0 });
  const [beds, setBeds] = useState([]);

  const loadBeds = async () => {
    try {
      const res = await fetch('/api/beds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBeds(data.data);
      }
    } catch (err) {
      console.error("Failed to load beds:", err);
    }
  };

  const handleBedStatus = async (bedId, status) => {
    try {
      const res = await fetch(`/api/beds/${bedId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        loadBeds();
      }
    } catch (err) {
      console.error('Failed to change bed status', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const queueRes = await fetch('/api/tokens/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const queueData = await queueRes.json();
      
      const apptRes = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const apptData = await apptRes.json();

      if (queueData.success && apptData.success) {
        const userBranch = user?.branchId;
        
        // Today's Queue Live
        const liveQueue = queueData.data.filter(t => {
          const isBranchMatch = userBranch === 'all' || t.branchId === userBranch;
          const isActiveStatus = t.status === 'waiting' || t.status === 'consulting';
          return isBranchMatch && isActiveStatus;
        });

        // Completed Yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const completedYesterdayList = queueData.data.filter(t => {
          const isBranchMatch = userBranch === 'all' || t.branchId === userBranch;
          const isResolved = t.status === 'resolved';
          if (!isBranchMatch || !isResolved) return false;
          const resolvedDateStr = (t.resolvedAt || t.updatedAt || '').split('T')[0];
          return resolvedDateStr === yesterdayStr;
        });

        // Upcoming Pending Pipeline
        const todayStr = new Date().toISOString().split('T')[0];
        const upcomingPendingList = apptData.data.filter(a => {
          const isBranchMatch = userBranch === 'all' || a.branchId === userBranch;
          const isPending = a.status === 'scheduled';
          if (!isBranchMatch || !isPending) return false;
          return a.appointmentDate > todayStr;
        });

        setAnalytics({
          todayQueue: liveQueue.length,
          completedYesterday: completedYesterdayList.length,
          upcomingPending: upcomingPendingList.length
        });
      }
    } catch (err) {
      console.error("Failed to load doctor analytics:", err);
    }
  };

  useEffect(() => {
    if (token) {
      loadAnalytics();
      loadBeds();
      const interval = setInterval(() => {
        loadAnalytics();
        loadBeds();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  // Set active patient if selected from dashboard
  useEffect(() => {
    if (activePatientFromDashboard) {
      setActivePatient(activePatientFromDashboard);
      setActiveToken(activeTokenFromDashboard);
      loadPatientHistory(activePatientFromDashboard._id);
    }
  }, [activePatientFromDashboard, activeTokenFromDashboard]);

  // Handle Search for Patient
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/search?q=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  const [pastHistory, setPastHistory] = useState(null);

  const loadPatientHistory = async (patientId) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPastHistory(data.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPatient = (p) => {
    setActivePatient(p);
    setActiveToken(null);
    setSearchQuery('');
    setSearchResults([]);
    loadPatientHistory(p._id);
    
    // Clear form
    setChiefComplaint('');
    setSymptoms('');
    setDiagnosis('');
    setTreatmentPlan('');
    setDoctorNotes('');
    setAddedTreatments([]);
    setMedicines([{ name: 'Amoxicillin 500mg', dosage: '1 tab', frequency: 'Three times daily', duration: '5 days', instructions: 'After food' }]);
    setFinalizedPrescription(null);
    setSubmitSuccess(false);
  };

  // Prescription Auto Save logic
  useEffect(() => {
    if (!token || !activePatient || finalizedPrescription) return;

    const autoSaveTimer = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        const res = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            consultationId: activeToken?._id || 'walk-in-session',
            patientId: activePatient._id,
            medicines,
            doctorNotes,
            isDraft: true
          })
        });
        const data = await res.json();
        if (data.success) {
          setActivePrescriptionId(data.data._id);
          setAutoSaveStatus('saved');
        } else {
          setAutoSaveStatus('error');
        }
      } catch {
        setAutoSaveStatus('error');
      }
    }, 3000); // Trigger auto save 3s after typing pauses

    return () => clearTimeout(autoSaveTimer);
  }, [medicines, doctorNotes, activePatient, token]);

  // Submit and Finalize Session
  const handleFinalize = async () => {
    if (!activePatient) return;
    try {
      // 1. Create Consultation
      const resConsult = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: activePatient._id,
          chiefComplaint,
          symptoms,
          diagnosis,
          treatmentPlan,
          tokenId: activeToken?._id || null
        })
      });
      const dataConsult = await resConsult.json();

      if (dataConsult.success) {
        const consultId = dataConsult.data._id;

        // 2. Add recorded treatments
        for (const item of addedTreatments) {
          await fetch('/api/treatments', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              consultationId: consultId,
              patientId: activePatient._id,
              treatmentType: item.type,
              toothNumber: item.tooth,
              cost: item.cost
            })
          });
        }

        // 3. Finalize prescription draft to locked state
        if (activePrescriptionId) {
          const resRx = await fetch(`/api/prescriptions/${activePrescriptionId}/finalize`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dataRx = await resRx.json();
          if (dataRx.success) {
            setFinalizedPrescription(dataRx.data);
          }
        }

        // 4. Set Daily token status to completed
        if (activeToken) {
          await fetch(`/api/tokens/${activeToken._id}/status`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed' })
          });
        }

        // 5. Automatically transition 'wip' or 'occupied' beds for this branch to 'cleaning' across the network
        try {
          const bedsRes = await fetch('/api/beds', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const bedsData = await bedsRes.json();
          if (bedsData.success) {
            const userBranch = user?.branchId;
            const activeWipBeds = bedsData.data.filter(b => {
              const isBranchMatch = userBranch === 'all' || b.branchId === userBranch;
              return isBranchMatch && (b.status === 'wip' || b.status === 'occupied');
            });
            for (const b of activeWipBeds) {
              await fetch(`/api/beds/${b._id}/status`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cleaning' })
              });
            }
          }
        } catch (bedErr) {
          console.error("Failed to automatically set beds to cleaning:", bedErr);
        }

        setSubmitSuccess(true);
        if (onConsultationFinished) onConsultationFinished();
      }
    } catch (err) {
      console.error('Failed to finalize medical records:', err);
    }
  };

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const selectSuggestedDrug = (index, drugName) => {
    updateMedicine(index, 'name', drugName);
    setFocusedMedIndex(null);
  };

  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft  = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft  = [31, 32, 33, 34, 35, 36, 37, 38];

  const renderToothBox = (num) => {
    const isSelected = toothNumber === String(num);
    const matchingTreatments = addedTreatments.filter(at => String(at.tooth) === String(num));
    const hasTreatment = matchingTreatments.length > 0;
    
    let bgClass = 'bg-white text-slate-700 hover:bg-indigo-50 border-slate-200';
    if (isSelected) {
      bgClass = 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-400 ring-2 ring-indigo-300';
    } else if (hasTreatment) {
      const type = matchingTreatments[0].type;
      if (type === 'Tooth Extraction') {
        bgClass = 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300';
      } else if (type === 'Root Canal Treatment') {
        bgClass = 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300';
      } else if (type === 'Composite Filling') {
        bgClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300';
      } else {
        bgClass = 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300';
      }
    }

    return (
      <button
        key={num}
        type="button"
        onClick={() => {
          if (isSelected) {
            setToothNumber('');
          } else {
            setToothNumber(String(num));
          }
        }}
        className={`w-7 h-8 text-[11px] font-mono font-bold flex flex-col items-center justify-center rounded border transition shadow-sm ${bgClass}`}
        title={`Tooth FDI ${num}${hasTreatment ? ` (${matchingTreatments.map(t => t.type).join(', ')})` : ''}`}
      >
        <span>{num}</span>
      </button>
    );
  };

  const handlePrintPrescription = () => {
    const sourceElement = document.getElementById('letterhead-pad-content');
    if (!sourceElement) { alert("Prescription preview content area not found in DOM."); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the prescription.");
      return;
    }
    printWindow.document.write(`<html><head><title>Prescription</title><style>body { font-family: sans-serif; padding: 25px; color: #333; line-height: 1.4; }</style></head><body>${sourceElement.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Doctor Analytics Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Today's Queue Live</p>
            <h3 className="text-3xl font-extrabold mt-1">{analytics.todayQueue}</h3>
          </div>
          <p className="text-[11px] text-indigo-100 mt-2 font-medium">Active branch tokens waiting / consulting</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Yesterday</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.completedYesterday}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Finalized cases signed off yesterday</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Pending Pipeline</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.upcomingPending}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Future scheduled appointment bookings</p>
        </div>
      </div>

      {/* Top action strip: Search patient if none active */}
      {!activePatient ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Load Patient Workspace</h3>
            <p className="text-xs text-slate-400">Search for patients by clinical code, name, or phone number to open clinical desk</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter search keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white max-h-60 overflow-y-auto">
              {searchResults.map((p) => (
                <div
                  key={p._id}
                  onClick={() => handleSelectPatient(p)}
                  className="p-3 hover:bg-slate-50/50 cursor-pointer flex justify-between items-center text-xs"
                >
                  <div>
                    <strong className="text-slate-800">{p.name}</strong>
                    <span className="text-slate-400 font-mono ml-2">({p.patientId})</span>
                  </div>
                  <span className="text-slate-500 font-mono">{p.mobile}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main workspace (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-indigo-600 font-extrabold font-mono uppercase tracking-widest">Active Doctor Session</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{activePatient.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: <span className="font-mono font-semibold text-slate-700">{activePatient.patientId}</span> | Age: {activePatient.age} | Blood: {activePatient.bloodGroup || 'N/A'}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-500 font-mono">
                <span className={`w-2 h-2 rounded-full ${autoSaveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
                {autoSaveStatus === 'saved' ? 'Saves synchronized' : autoSaveStatus === 'saving' ? 'Auto-saving...' : 'Draft initialized'}
              </div>
            </div>

            {/* Compact Bed Ward Manager Row */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  🛏️ Bed Ward Manager
                </span>
                <span className="text-[9px] text-slate-400">Directly manage procedure chairs / beds</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {beds
                  .filter(b => user?.branchId === 'all' || b.branchId === user?.branchId)
                  .map((bed) => {
                    const isActiveAvailable = bed.status === 'available';
                    const isActiveWip = bed.status === 'wip' || bed.status === 'occupied';
                    const isActiveCleaning = bed.status === 'cleaning';

                    return (
                      <div 
                        key={bed._id} 
                        className={`p-2 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
                          isActiveAvailable 
                            ? 'bg-emerald-50/20 border-emerald-100 shadow-sm' 
                            : isActiveWip 
                              ? 'bg-rose-50/20 border-rose-100 shadow-sm' 
                              : 'bg-amber-50/30 border-amber-100 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 text-[10px] truncate" title={bed.label}>
                            {bed.label}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isActiveAvailable 
                              ? 'bg-emerald-500' 
                              : isActiveWip 
                                ? 'bg-rose-500' 
                                : 'bg-amber-500'
                          }`}></span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-1.5">
                          <button
                            type="button"
                            onClick={() => handleBedStatus(bed._id, 'available')}
                            className={`py-0.5 rounded text-[9px] font-bold transition flex items-center justify-center ${
                              isActiveAvailable 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/60'
                            }`}
                          >
                            Vacant
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBedStatus(bed._id, 'wip')}
                            className={`py-0.5 rounded text-[9px] font-bold transition flex items-center justify-center ${
                              isActiveWip 
                                ? 'bg-rose-500 text-white shadow-sm' 
                                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/60'
                            }`}
                          >
                            WIP
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBedStatus(bed._id, 'cleaning')}
                            className={`py-0.5 rounded text-[9px] font-bold transition flex items-center justify-center ${
                              isActiveCleaning 
                                ? 'bg-amber-500 text-white shadow-sm' 
                                : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200/60'
                            }`}
                          >
                            Clean
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Complaints & Symptoms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Chief Complaint *</label>
                  <input
                    type="text"
                    required
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                    placeholder="e.g. Sharp pain in lower molar"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Symptoms Details</label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                    placeholder="e.g. Sensitivity to cold, night aches"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Diagnosis Notes</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                    placeholder="e.g. Deep caries, acute pulpitis"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Treatment Plan Proposal</label>
                  <input
                    type="text"
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                    placeholder="e.g. Standard 3-visit Root Canal Treatment"
                  />
                </div>
              </div>

              {/* Treatments Panel */}
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                <span className="font-bold text-slate-700 block">Record Clinical Procedures</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Select Preset</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Root Canal Treatment') {
                          setTreatmentType('Root Canal Treatment');
                          setTreatmentCost('4500');
                        } else if (val === 'Scaling & Polishing') {
                          setTreatmentType('Scaling & Polishing');
                          setTreatmentCost('1200');
                        } else if (val === 'Tooth Extraction') {
                          setTreatmentType('Tooth Extraction');
                          setTreatmentCost('1500');
                        } else if (val === 'Composite Filling') {
                          setTreatmentType('Composite Filling');
                          setTreatmentCost('1800');
                        } else if (val === 'Custom') {
                          setTreatmentType('');
                          setTreatmentCost('');
                        }
                      }}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs h-9"
                      defaultValue="Root Canal Treatment"
                    >
                      <option value="Root Canal Treatment">Root Canal Treatment (₹4500)</option>
                      <option value="Scaling & Polishing">Scaling & Polishing (₹1200)</option>
                      <option value="Tooth Extraction">Tooth Extraction (₹1500)</option>
                      <option value="Composite Filling">Composite Filling (₹1800)</option>
                      <option value="Custom">Custom Procedure...</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Procedure Description / Name</label>
                    <input
                      type="text"
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs h-9"
                      placeholder="Type custom procedure name..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Charge (₹)</label>
                    <input
                      type="number"
                      value={treatmentCost}
                      onChange={(e) => setTreatmentCost(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs h-9 font-semibold"
                      placeholder="Price"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Tooth ID</label>
                    <input
                      type="text"
                      value={toothNumber}
                      onChange={(e) => setToothNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs h-9"
                      placeholder="Tooth"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAddedTreatments([...addedTreatments, { type: treatmentType || 'Dental Treatment', tooth: toothNumber, cost: treatmentCost || '0' }]);
                        setToothNumber('');
                      }}
                      className="w-full flex justify-center items-center gap-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Append
                    </button>
                  </div>
                </div>

                {/* Visual Interactive 32-Tooth Dental Chart */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-3">
                  <AdvancedDentalChart
                    patientId={activePatient._id}
                    token={token}
                    user={user}
                    onTreatmentAdded={(item) => {
                      setAddedTreatments([...addedTreatments, { type: item.type, tooth: item.tooth, cost: item.cost }]);
                      setToothNumber(item.tooth || '');
                    }}
                  />
                </div>

                {addedTreatments.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 p-2.5 divide-y divide-slate-100">
                    {addedTreatments.map((t, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 text-slate-700">
                        <span>{t.type} {t.tooth && `(Tooth: ${t.tooth})`}</span>
                        <div className="flex items-center gap-3">
                          <strong className="text-slate-800">₹{t.cost}</strong>
                          <button
                            onClick={() => setAddedTreatments(addedTreatments.filter((_, idx) => idx !== i))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescription module */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 block">Digital Prescription Pad</span>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Drug Row
                  </button>
                </div>

                <div className="space-y-2.5">
                  {medicines.map((med, index) => (
                    <div key={index} className="relative grid grid-cols-1 sm:grid-cols-5 gap-2 border border-slate-150 p-3 rounded-xl bg-slate-50/30">
                      
                      {/* Drug Name with Autocomplete suggestions */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Drug Name"
                          value={med.name}
                          onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                          onFocus={() => setFocusedMedIndex(index)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                        />
                        {focusedMedIndex === index && (
                          <div className="absolute left-0 right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto font-sans">
                            {COMMON_DRUGS.filter(d => d.toLowerCase().includes(med.name.toLowerCase())).map((drug) => (
                              <div
                                key={drug}
                                onClick={() => selectSuggestedDrug(index, drug)}
                                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700"
                              >
                                {drug}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (1-0-1)"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Duration (5 Days)"
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Instructions (After Food)"
                          value={med.instructions}
                          onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Doctor Advice / Notes</label>
                <textarea
                  rows={2}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  placeholder="e.g. Do not consume warm beverages for 4 hours, soft diet..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setActivePatient(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition"
                >
                  Close Session
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Finalize and Issue RX
                </button>
              </div>
            </div>
          </div>

          {/* Letterhead Print Preview & Case History (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Past Case History Section */}
            {pastHistory && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Past Clinical History</h4>
                  <p className="text-[10px] text-slate-400">Previous clinical consultations, treatments and diagnostic logs</p>
                </div>

                {(!pastHistory.consultations || pastHistory.consultations.length === 0) ? (
                  <p className="text-[11px] text-slate-400 italic">No previous clinical history on file.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto divide-y divide-slate-100 pr-1">
                    {pastHistory.consultations.map((c, i) => {
                      const cRx = pastHistory.prescriptions?.find(p => p.consultationId === c._id);
                      return (
                        <div key={c._id} className={`pt-3 ${i === 0 ? 'pt-0' : ''} text-[11px] space-y-1.5`}>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-indigo-600 font-mono">
                              {new Date(c.visitDate).toLocaleDateString()}
                            </span>
                            <span className="text-slate-400 font-medium">
                              By Dr. R.K. Prasad
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-500"><strong className="text-slate-700 font-semibold">Complaint:</strong> {c.chiefComplaint}</p>
                            {c.diagnosis && <p className="text-slate-500"><strong className="text-slate-700 font-semibold">Diagnosis:</strong> {c.diagnosis}</p>}
                            {c.treatmentPlan && <p className="text-slate-500"><strong className="text-slate-700 font-semibold">Plan:</strong> {c.treatmentPlan}</p>}
                          </div>
                          {cRx && cRx.medicines && cRx.medicines.length > 0 && (
                            <div className="bg-slate-50/60 p-2 rounded-lg border border-slate-100">
                              <p className="font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-1">Prescribed Medicines:</p>
                              <ul className="list-disc list-inside space-y-0.5 text-[9px] font-mono text-slate-600">
                                {cRx.medicines.map((m, mIdx) => (
                                  <li key={mIdx}>{m.name} ({m.dosage}) · {m.frequency}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Print Letterhead Pad</h4>
                  <p className="text-[10px] text-slate-400">Prescription blueprint layout format for desk printing</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrintPrescription}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm no-print"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Prescription
                </button>
              </div>

              {/* Scoped print override styles */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #letterhead-pad-content, #letterhead-pad-content * {
                    visibility: visible;
                  }
                  #letterhead-pad-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                }
              `}</style>

              {/* Printable Frame */}
              <div id="letterhead-pad-content" className="border border-slate-250 rounded-xl p-5 bg-white shadow-inner font-serif text-[10px] leading-relaxed text-slate-800 space-y-4">
                {/* Header block */}
                <div className="text-center border-b border-indigo-100 pb-3 font-sans">
                  <h3 className="font-extrabold text-indigo-700 text-xs tracking-tight">RK DENTAL CLINIC</h3>
                  <p className="text-[7px] text-slate-500 font-medium uppercase tracking-wider">Multi-Specialty Clinical Suite</p>
                  <p className="text-[6px] text-slate-400 mt-0.5">Contact: 044-23456789 | Dr. R.K. Prasad BDS MDS</p>
                </div>

                {/* Demographics block */}
                <div className="grid grid-cols-2 gap-2 text-[7px] border-b border-slate-100 pb-2.5 font-sans text-slate-500">
                  <div>
                    <p><strong>Patient:</strong> {activePatient.name}</p>
                    <p><strong>Clinical ID:</strong> {activePatient.patientId}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Age/Gender:</strong> {activePatient.age} / {activePatient.gender}</p>
                  </div>
                </div>

                {/* RX drug listing block */}
                <div className="space-y-2">
                  <span className="font-sans text-[8px] text-slate-400 font-bold uppercase tracking-wider">Rx Prescription</span>
                  <div className="space-y-2 font-mono text-[8px]">
                    {medicines.filter(m => m.name).map((med, i) => (
                      <div key={i} className="leading-snug">
                        <p className="font-bold text-slate-900">{i + 1}. {med.name} {med.dosage && `(${med.dosage})`}</p>
                        <p className="text-[7px] text-slate-500 italic ml-2">Freq: {med.frequency} | Dur: {med.duration} | {med.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Procedures Block */}
                {addedTreatments.length > 0 && (
                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <span className="font-sans text-[8px] text-slate-400 font-bold uppercase tracking-wider">Recorded Procedures</span>
                    <div className="space-y-1 font-mono text-[8px]">
                      {addedTreatments.map((t, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-900">
                          <span>{i + 1}. {t.type} {t.tooth && `(Tooth: ${t.tooth})`}</span>
                          <strong>₹{t.cost}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advice Notes */}
                {doctorNotes && (
                  <div className="border-t border-slate-100 pt-2 font-sans text-[7px] text-slate-500">
                    <p><strong>Advice:</strong> {doctorNotes}</p>
                  </div>
                )}

                {/* Signature box */}
                <div className="pt-6 flex justify-between items-end border-t border-slate-100 font-sans text-[6px] text-slate-400">
                  <span>Digitally recorded in clinical files</span>
                  <div className="text-right text-[7px] text-slate-700 font-bold">
                    <div className="h-4 border-b border-slate-200 w-16 ml-auto"></div>
                    <p className="mt-1">Authorized Signature</p>
                  </div>
                </div>
              </div>

              {submitSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col gap-2 font-sans">
                  <span className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Finished and Finalized!
                  </span>
                  <p className="text-[10px] text-slate-600">This consultation visit is recorded. The prescription can now be sent to printers or shared.</p>
                  <div className="flex flex-col gap-2 mt-1">
                    <button
                      onClick={() => {
                        if (window.electronAPI && typeof window.electronAPI.print === 'function') {
                          window.electronAPI.print();
                        } else {
                          window.print();
                        }
                      }}
                      className="w-full flex justify-center items-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Printer className="w-4 h-4" /> Trigger Clinical Print
                    </button>
                    <button
                      onClick={() => {
                        const message = `Hello ${activePatient.name}, here is your prescription from RK Dental Clinic:\n` + 
                          medicines.map((m, idx) => `${idx + 1}. ${m.name} - ${m.dosage} (${m.frequency})`).join('\n') + 
                          (doctorNotes ? `\nAdvice: ${doctorNotes}` : '');
                        if (window.electronAPI && typeof window.electronAPI.shareWhatsApp === 'function') {
                          window.electronAPI.shareWhatsApp({ phone: activePatient.mobile, message });
                        } else {
                          window.open(`https://wa.me/${activePatient.mobile}?text=${encodeURIComponent(message)}`, '_blank');
                        }
                      }}
                      className="w-full flex justify-center items-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Share via WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
