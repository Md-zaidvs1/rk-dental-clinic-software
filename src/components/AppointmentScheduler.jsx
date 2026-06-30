import React, { useState, useEffect } from 'react';
import { Search, Calendar, Check, AlertCircle, Clock, Plus, UserPlus, Trash2, CalendarDays } from 'lucide-react';

export default function AppointmentScheduler({ token, user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state to book an appointment
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Booking Form fields
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [visitType, setVisitType] = useState('Consultation');
  const [notes, setNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab filter
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAppointments();
  }, [token]);

  // Live Patient Search
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

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedPatient) {
      setErrorMsg('Please select a registered patient first.');
      return;
    }
    if (!appointmentDate || !appointmentTime) {
      setErrorMsg('Please choose both date and time.');
      return;
    }

    const fullDateTime = `${appointmentDate}T${appointmentTime}`;

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          appointmentDate: fullDateTime,
          visitType,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Appointment booked successfully for ${selectedPatient.name}.`);
        setAppointmentDate('');
        setAppointmentTime('');
        setNotes('');
        setSelectedPatient(null);
        setSearchQuery('');
        loadAppointments();
      } else {
        setErrorMsg(data.message || 'Booking failed.');
      }
    } catch (err) {
      setErrorMsg('Server connection error.');
    }
  };

  const handleUpdateStatus = async (apptId, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadAppointments();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Check patient in & issue active queue token
  const handlePatientArrival = async (appt) => {
    try {
      // 1. Generate active queue token
      const resToken = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patientId: appt.patientId, appointmentId: appt._id })
      });
      const dataToken = await resToken.json();

      if (dataToken.success) {
        // 2. Mark appointment as arrived/completed or active
        await handleUpdateStatus(appt._id, 'completed');
        alert(`Arrived! Issued Token Number: ${dataToken.data.tokenNumber}`);
        loadAppointments();
      } else {
        alert(dataToken.message || 'Failed to issue token.');
      }
    } catch (err) {
      console.error('Error checking in patient:', err);
    }
  };

  const filteredAppts = appointments.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Appointments & Scheduling</h2>
          <p className="text-xs text-slate-400">Schedule clinical visits, check-in arrivals, and manage patient flows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Book Appointment Form */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Schedule New Visit</h3>
          </div>

          {user?.role?.toLowerCase() === 'doctor' ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <span className="text-2xl">🔒</span>
              <p className="text-xs font-bold text-slate-800">Booking Restricted</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Doctor accounts do not have appointment booking rights. Please log in as a receptionist or clinic owner to manage the appointment schedule.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              {/* Patient Search */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ID, Name or Mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                {/* Suggestions dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-1 border border-slate-100 bg-white rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-50">
                    {searchResults.map(p => (
                      <div
                        key={p._id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setSearchResults([]);
                          setSearchQuery(p.name);
                        }}
                        className="p-2 hover:bg-indigo-50/50 cursor-pointer text-left"
                      >
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.patientId} · {p.mobile}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-100/50 px-1.5 py-0.5 rounded uppercase">Active Selected</span>
                    <p className="font-bold text-slate-800 mt-1">{selectedPatient.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{selectedPatient.patientId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visit Type / Procedure</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Consultation">Consultation / Check-up</option>
                  <option value="Scaling & Polishing">Scaling & Polishing</option>
                  <option value="Tooth Extraction">Tooth Extraction</option>
                  <option value="Root Canal Treatment">Root Canal Treatment</option>
                  <option value="Composite Filling">Composite Filling</option>
                  <option value="Dental Crown (Ceramic)">Dental Crown</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Patient has slight swelling..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                Book Appointment Slot
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Appointments List */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-3 gap-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              Patient Schedule Directory
            </h3>

            {/* Filter Pills */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'scheduled' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'completed' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Arrived
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'cancelled' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-slate-400 py-12 text-xs">Loading schedules...</p>
          ) : filteredAppts.length === 0 ? (
            <div className="text-center text-slate-400 py-12 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">No appointments found matching selection.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredAppts.map((appt) => {
                const isScheduled = appt.status === 'scheduled';
                const isCompleted = appt.status === 'completed';
                const isCancelled = appt.status === 'cancelled';

                const displayDate = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                });
                const displayTime = new Date(appt.appointmentDate).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={appt._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition hover:bg-slate-50/40 px-2 rounded-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 text-sm">{appt.patient?.name || 'Unknown Patient'}</strong>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                          {appt.patient?.patientId || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {displayDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {displayTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-600 font-bold bg-indigo-50/50 px-2 py-0.5 rounded-md inline-block">
                        Procedure: {appt.visitType}
                      </p>
                      {appt.notes && (
                        <p className="text-[10px] text-slate-400 italic">Notes: {appt.notes}</p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto">
                      {isScheduled && (
                        <div className="flex gap-2 w-full justify-end">
                          <button
                            onClick={() => handlePatientArrival(appt)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
                          >
                            Mark Arrived & Issue Token
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appt._id, 'cancelled')}
                            className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 text-[11px] font-bold rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
                          Arrived & Checked In
                        </span>
                      )}

                      {isCancelled && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
