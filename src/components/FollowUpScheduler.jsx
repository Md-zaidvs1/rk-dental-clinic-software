import React, { useState, useEffect } from 'react';
import { Search, Calendar, Check, AlertCircle, Clock } from 'lucide-react';

export default function FollowUpScheduler({ token }) {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state to schedule a new follow-up
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form input states
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/followups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFollowups(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadFollowups();
  }, [token]);

  // Handle Search
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

  const handleSchedule = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!selectedPatient || !followUpDate) return;

    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          followUpDate,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Follow-up scheduled successfully for ${selectedPatient.name}.`);
        setFollowUpDate('');
        setNotes('');
        setSelectedPatient(null);
        loadFollowups();
      } else {
        setErrorMsg(data.message || 'Scheduling failed.');
      }
    } catch (err) {
      setErrorMsg('Server error. Failed to schedule follow-up.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/followups/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        loadFollowups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Schedule a new follow-up (4 cols) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Schedule Follow-Up</h3>
          <p className="text-xs text-slate-400">Set upcoming dental checkups or routine procedure schedules</p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" /> {errorMsg}
          </div>
        )}

        {!selectedPatient ? (
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Find Patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border border-slate-100 rounded-xl bg-white max-h-40 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map(p => (
                  <div
                    key={p._id}
                    onClick={() => setSelectedPatient(p)}
                    className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <strong className="text-slate-700">{p.name}</strong> <span className="text-slate-400 font-mono text-[10px]">({p.patientId})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSchedule} className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-slate-800 text-xs">{selectedPatient.name}</strong>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedPatient.patientId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-[10px] font-bold text-indigo-600"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Follow-Up Date *</label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Procedural Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                placeholder="e.g. Suture removal, bracket check, scaling repeat"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              Add Schedule Entry
            </button>
          </form>
        )}
      </div>

      {/* Follow-Ups lists (8 cols) */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Schedules Index</h3>
          <p className="text-xs text-slate-400">View upcoming routine dental recalls & status progression</p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading schedules indices...</p>
        ) : followups.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-100 rounded-xl">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto animate-pulse mb-2" />
            <p className="text-slate-500 font-medium text-xs">No active schedules registered</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
            {followups.map((f) => {
              const isPending = f.status === 'pending';
              const isCompleted = f.status === 'completed';
              const isMissed = f.status === 'missed';

              return (
                <div key={f._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4.5 gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-800">{f.patient?.name}</strong>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isMissed
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[10px] mt-1">ID: {f.patient?.patientId} | Phone: {f.patient?.mobile}</p>
                    {f.notes && (
                      <p className="text-slate-600 font-medium text-[11px] mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Notes: {f.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px] font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      {new Date(f.followUpDate).toLocaleDateString()}
                    </div>

                    {isPending && (
                      <div className="flex gap-1.5 font-sans">
                        <button
                          onClick={() => handleUpdateStatus(f._id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(f._id, 'missed')}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold"
                        >
                          Missed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
