import React, { useState, useEffect } from 'react';
import { Search, Check, AlertCircle, FileText, ArrowRight, ClipboardList, Activity, Image as ImageIcon, History } from 'lucide-react';
import { useAuth } from '../store/authStore.js';
import AdvancedDentalChart from './AdvancedDentalChart.jsx';
import RadiologyModule from './RadiologyModule.jsx';

export default function PatientManagement({ token, onSelectPatient, onStartConsultation }) {
  const [activeSubTab, setActiveSubTab] = useState('search');
  const { user } = useAuth();
  const [profileTab, setProfileTab] = useState('timeline');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('male');
  const [regMobile, setRegMobile] = useState('');
  const [regAltMobile, setRegAltMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('');
  const [regMedicalHistory, setRegMedicalHistory] = useState('');
  
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [regToken, setRegToken] = useState(null);

  // Search execution
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
        console.error('Error searching patients:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, token]);

  const loadPatient360 = async (patient) => {
    try {
      const res = await fetch(`/api/patients/${patient._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPatient(data.data.patient);
        setPatientHistory(data.data.history);
      }
    } catch (err) {
      console.error('Error loading patient 360 data:', err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegSuccess('');
    setRegError('');
    setRegToken(null);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: regName,
          age: regAge,
          gender: regGender,
          mobile: regMobile,
          alternateMobile: regAltMobile,
          address: regAddress,
          occupation: regOccupation,
          bloodGroup: regBloodGroup,
          allergies: regAllergies ? regAllergies.split(',').map(s => s.trim()) : [],
          medicalHistory: regMedicalHistory,
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess(`Patient ${data.data.name} has been registered successfully with clinical ID ${data.data.patientId}.`);
        
        // Immediately issue token
        const resTok = await fetch('/api/tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ patientId: data.data._id })
        });
        const dataTok = await resTok.json();
        if (dataTok.success) {
          setRegToken(dataTok.data);
        }

        // Reset fields
        setRegName('');
        setRegAge('');
        setRegMobile('');
        setRegAltMobile('');
        setRegAddress('');
        setRegOccupation('');
        setRegAllergies('');
        setRegMedicalHistory('');
      } else {
        setRegError(data.message || 'Patient registration failed.');
      }
    } catch (err) {
      setRegError('Server connection error. Failed to add patient.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('search')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'search'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinical Index & Patient 360
        </button>
        <button
          onClick={() => setActiveSubTab('register')}
          className={`pb-3 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'register'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quick Registration
        </button>
      </div>

      {activeSubTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Search column (5 columns) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Patient Search</h3>
              <p className="text-xs text-slate-400">Search by ID, name, or mobile number</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Type in patient keywords to search records</p>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => {
                      loadPatient360(p);
                      if (onSelectPatient) onSelectPatient(p._id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${
                      selectedPatient?._id === p._id
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{p.patientId} | {p.mobile}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Patient 360 View column (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedPatient ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto animate-pulse mb-3" />
                <p className="text-slate-600 font-semibold text-sm">No patient selected for detailed review</p>
                <p className="text-slate-400 text-xs mt-1">Select a patient from the sidebar directory search</p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold font-mono px-2 py-0.5 rounded-md">
                        {selectedPatient.patientId}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Age: {selectedPatient.age} | Gender: <span className="capitalize">{selectedPatient.gender}</span> | Blood: <span className="font-bold">{selectedPatient.bloodGroup || 'N/A'}</span>
                    </p>
                  </div>

                  {onStartConsultation && (
                    <button
                      onClick={() => onStartConsultation(selectedPatient)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Open in Doctor Desk
                    </button>
                  )}
                </div>

                {/* Patient 360 Profile Navigation Sub-tabs */}
                <div className="flex border-b border-slate-100 pb-2 gap-4">
                  <button
                    onClick={() => setProfileTab('timeline')}
                    className={`pb-2 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
                      profileTab === 'timeline'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" /> Clinical Timeline & Profile
                  </button>
                  <button
                    onClick={() => setProfileTab('chart')}
                    className={`pb-2 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
                      profileTab === 'chart'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Dental Chart
                  </button>
                  <button
                    onClick={() => setProfileTab('radiology')}
                    className={`pb-2 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 ${
                      profileTab === 'radiology'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Radiology & RVG
                  </button>
                </div>

                {profileTab === 'timeline' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Demographics details */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Profile Information</h4>
                      <div className="space-y-2 text-xs text-slate-600">
                        <p><strong className="text-slate-700">Mobile Phone:</strong> {selectedPatient.mobile}</p>
                        {selectedPatient.alternateMobile && (
                          <p><strong className="text-slate-700">Alternate Phone:</strong> {selectedPatient.alternateMobile}</p>
                        )}
                        <p><strong className="text-slate-700">Occupation:</strong> {selectedPatient.occupation || 'N/A'}</p>
                        <p><strong className="text-slate-700">Allergies:</strong> <span className="text-rose-600 font-semibold">{selectedPatient.allergies && selectedPatient.allergies.length > 0 ? selectedPatient.allergies.join(', ') : 'None Reported'}</span></p>
                        <p><strong className="text-slate-700">Past Medical History:</strong> {selectedPatient.medicalHistory || 'No special conditions'}</p>
                        <p><strong className="text-slate-700">Home Address:</strong> {selectedPatient.address || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Clinical Timeline */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chronological Timeline</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {patientHistory && patientHistory.consultations && patientHistory.consultations.length > 0 ? (
                          patientHistory.consultations.map((c) => (
                            <div key={c._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span>Complaint: {c.chiefComplaint}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(c.visitDate).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-500"><strong className="text-slate-600">Diagnosis:</strong> {c.diagnosis || 'None'}</p>
                              <p className="mt-0.5 text-slate-500"><strong className="text-slate-600">Treatment Plan:</strong> {c.treatmentPlan || 'None'}</p>
                              
                              {/* Attach prescription view if any */}
                              {patientHistory.prescriptions && patientHistory.prescriptions.find((p) => p.consultationId === c._id) && (
                                <div className="mt-2 text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" /> Prescription Attached
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 py-4 text-center">No past consultations or medical history found.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === 'chart' && (
                  <AdvancedDentalChart 
                    patientId={selectedPatient._id} 
                    token={token} 
                    user={user} 
                  />
                )}

                {profileTab === 'radiology' && (
                  <RadiologyModule 
                    patientId={selectedPatient._id} 
                    token={token} 
                    user={user} 
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'register' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Quick Patient Registration</h3>
            <p className="text-xs text-slate-400">Add a new patient quickly and immediately push them onto today's token queue.</p>
          </div>

          {regSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold font-sans">
                <Check className="w-4 h-4 text-emerald-600" /> Registration Successful!
              </div>
              <p>{regSuccess}</p>
              {regToken && (
                <div className="mt-1 p-2 bg-white/80 rounded-lg border border-emerald-100 flex justify-between items-center text-[11px] font-sans">
                  <span>Generated Daily Queue Token:</span>
                  <strong className="bg-emerald-600 text-white px-2 py-0.5 rounded font-mono text-xs">{regToken.tokenNumber}</strong>
                </div>
              )}
            </div>
          )}

          {regError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {regError}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="Patient Full Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Age (Years) *</label>
                <input
                  type="number"
                  required
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  placeholder="e.g. 28"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Gender *</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Mobile Contact (10-digits) *</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="Primary mobile number"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Alternate Contact (Optional)</label>
              <input
                type="tel"
                value={regAltMobile}
                onChange={(e) => setRegAltMobile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="Alternate phone"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Blood Group</label>
              <select
                value={regBloodGroup}
                onChange={(e) => setRegBloodGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="AB+">AB+</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="O-">O-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Known Allergies</label>
              <input
                type="text"
                value={regAllergies}
                onChange={(e) => setRegAllergies(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="e.g. Penicillin, Pollen (comma separated)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Permanent Address</label>
              <textarea
                rows={2}
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="House no., street address, city, TN"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Past Medical History / Comorbidities</label>
              <textarea
                rows={2}
                value={regMedicalHistory}
                onChange={(e) => setRegMedicalHistory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                placeholder="Hypertension, Diabetes, Pregnancy, Cardiac disorders, etc."
              />
            </div>

            <div className="md:col-span-2 flex justify-end font-sans">
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition"
              >
                Register and Issue Token
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
