import React, { useState, useEffect } from 'react';
import { 
  Users, Ticket, Bed, IndianRupee, Play, CheckCircle, SkipForward, RefreshCw, LogOut, ArrowRight, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard({ 
  user, 
  token, 
  onLogout, 
  onSelectPatient, 
  onOpenConsultation, 
  onOpenBilling 
}) {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalRevenue: 0,
    chartData: []
  });

  const [queue, setQueue] = useState([]);
  const [beds, setBeds] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedPatientForBed, setSelectedPatientForBed] = useState({});
  const [loading, setLoading] = useState(true);

  const branchLabel = user?.branchId === 'branch-venpakkam' ? 'Venpakkam Branch' : 'Kalavai Branch';
  const roleLower = user?.role?.toLowerCase();
  const isReceptionist = roleLower === 'receptionist';

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Dashboard Reports
      const resStats = await fetch('/api/reports/dashboard', { headers });
      const dataStats = await resStats.json();
      if (dataStats.success) {
        setStats(dataStats.data);
      }

      // 2. Fetch Live Queue
      const resQueue = await fetch('/api/tokens/queue', { headers });
      const dataQueue = await resQueue.json();
      if (dataQueue.success) {
        setQueue(dataQueue.data);
      }

      // 3. Fetch Beds
      const resBeds = await fetch('/api/beds', { headers });
      const dataBeds = await resBeds.json();
      if (dataBeds.success) {
        setBeds(dataBeds.data);
      }

      // 4. Fetch Registered Patients for bed allocation selection
      const resPatients = await fetch('/api/patients', { headers });
      const dataPatients = await resPatients.json();
      if (dataPatients.success) {
        setAllPatients(dataPatients.data);
      }
    } catch (err) {
      console.error('Error loading dashboard datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds for real-time live boards
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [user?.branchId]);

  // Queue State handlers
  const handleTokenStatus = async (tokenId, nextStatus) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update token status', err);
    }
  };

  // Bed Release and State management
  const handleBedRelease = async (bedId) => {
    try {
      const res = await fetch(`/api/beds/${bedId}/release`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to release bed', err);
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
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change bed status', err);
    }
  };

  const activeWaiting = queue.filter(t => t.status === 'waiting').length;
  const activeBedsOccupied = beds.filter(b => b.status === 'occupied').length;

  return (
    <div id="dashboard-root" className="space-y-8 animate-fade-in">
      
      {/* Upper Status strip & Clinic Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Live Session Workspace</p>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Role: <span className="capitalize font-semibold text-indigo-600">{user?.role}</span> | Branch: <span className="font-semibold text-slate-700">{branchLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            id="refresh-btn"
            onClick={fetchData}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition duration-150"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            id="logout-btn"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50/50 transition duration-150 text-sm font-medium w-full md:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Registered patients */}
        <div id="kpi-patients" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Total Registered</p>
            <p className="text-3xl font-extrabold text-slate-900">{stats.totalPatients}</p>
            <p className="text-xs text-emerald-600 font-medium">All-time record</p>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Queue Count */}
        <div id="kpi-queue" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Active Queue Waiting</p>
            <p className="text-3xl font-extrabold text-slate-900">{activeWaiting}</p>
            <p className="text-xs text-amber-600 font-medium">Reset daily sequence</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Bed Occupancy */}
        <div id="kpi-beds" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Occupied Beds</p>
            <p className="text-3xl font-extrabold text-slate-900">{activeBedsOccupied}/2</p>
            <p className="text-xs text-rose-600 font-medium">In-patient surgeries</p>
          </div>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Revenue */}
        <div id="kpi-revenue" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Daily Branch Revenue</p>
            <p className="text-3xl font-extrabold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 font-medium">UPI / Cash / Cards</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main sections: Queue List & Operational Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Live Patient Tokens Queue (8 columns) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-500" />
                Live Patient Token Queue
              </h2>
              <p className="text-xs text-slate-500">Today's clinical progression timeline</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
              {queue.length} Total Today
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <Activity className="w-12 h-12 text-slate-300 animate-pulse mb-3" />
              <p className="text-slate-500 font-medium">No active tokens registered today.</p>
              <p className="text-slate-400 text-xs mt-1">Create tokens via Appointments or Walk-In registrations.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queue.map((item) => {
                const isWaiting = item.status === 'waiting';
                const isInConsult = item.status === 'in-consultation';
                const isCompleted = item.status === 'completed';

                return (
                  <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-4">
                      {/* Token badge identifier */}
                      <span className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-lg font-mono border ${
                        isInConsult 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : isCompleted 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}>
                        <span className="text-[10px] uppercase font-sans tracking-wide opacity-70">Tok</span>
                        {item.tokenNumber}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer" onClick={() => onSelectPatient(item.patientId)}>
                            {item.patient?.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInConsult 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : isCompleted 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          ID: <span className="font-semibold text-slate-700 font-mono">{item.patient?.patientId}</span> | Mobile: <span className="text-slate-700">{item.patient?.mobile}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {isWaiting && (
                        <>
                          {user.role === 'doctor' ? (
                            <button
                              onClick={() => {
                                handleTokenStatus(item._id, 'in-consultation');
                                onOpenConsultation(item.patient, item);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                            >
                              <Play className="w-3.5 h-3.5" /> Call In
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTokenStatus(item._id, 'in-consultation')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            >
                              Call In
                            </button>
                          )}
                          <button
                            onClick={() => handleTokenStatus(item._id, 'skipped')}
                            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl transition"
                            title="Skip Patient"
                          >
                            <SkipForward className="w-3.5 h-3.5 hover:translate-x-0.5 transition" /> Skip
                          </button>
                        </>
                      )}

                      {isInConsult && (
                        <>
                          {user.role === 'doctor' ? (
                            <button
                              onClick={() => onOpenConsultation(item.patient, item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition"
                            >
                              Open Chart
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleTokenStatus(item._id, 'completed')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Complete
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => onOpenBilling(item.patient, null)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-bold rounded-xl transition"
                        >
                          Invoice <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Surgeries & Treatment Bed Allocation + Weekly Analytics (4 columns) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Bed Ward Manager UI Grid Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-indigo-500" />
                  Bed Ward Manager
                </h2>
                <p className="text-xs text-slate-500">Interactive 3-state clinical procedure chairs & beds tracker</p>
              </div>
              {isReceptionist && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                  🔒 View Only
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {beds
                .filter(b => user?.branchId === 'all' || b.branchId === user?.branchId)
                .map((bed) => {
                  const isActiveAvailable = bed.status === 'available';
                  const isActiveWip = bed.status === 'wip' || bed.status === 'occupied';
                  const isActiveCleaning = bed.status === 'cleaning';

                  const bedNumberLabel = bed.label?.split('(')[0].trim();
                  const bedBranchLabel = bed.label?.match(/\(([^)]+)\)/)?.[1];

                  return (
                    <div 
                      key={bed._id} 
                      className={`p-4 sm:p-5 rounded-2xl border transition duration-200 flex flex-col justify-between gap-4 min-w-0 ${
                        isActiveAvailable 
                          ? 'bg-emerald-50/10 border-emerald-100 shadow-sm shadow-emerald-50/50' 
                          : isActiveWip 
                            ? 'bg-rose-50/20 border-rose-100 shadow-sm shadow-rose-50/50' 
                            : 'bg-amber-50/30 border-amber-100 shadow-sm shadow-amber-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">
                              {bedNumberLabel}
                            </h4>
                            {bedBranchLabel && (
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {bedBranchLabel}
                              </p>
                            )}
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 ${
                            isActiveAvailable 
                              ? 'bg-emerald-500' 
                              : isActiveWip 
                                ? 'bg-rose-500' 
                                : 'bg-amber-500'
                          }`}></span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 uppercase font-bold tracking-wider font-mono truncate">
                          {isActiveAvailable ? '🟢 Available' : isActiveWip ? '🔴 Active Treatment' : '🟡 Sanitising'}
                        </p>
                      </div>

                      {/* State Button Group */}
                      <div className={`grid grid-cols-3 gap-2.5 pt-2 ${isReceptionist ? 'pointer-events-none opacity-80' : 'pointer-events-auto'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (roleLower === 'doctor' || roleLower === 'owner') {
                              handleBedStatus(bed._id, 'available');
                            }
                          }}
                          className={`py-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center whitespace-nowrap ${
                            isActiveAvailable 
                              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60'
                          }`}
                          title="Set Available"
                        >
                          🟢 Vacant
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (roleLower === 'doctor' || roleLower === 'owner') {
                              handleBedStatus(bed._id, 'wip');
                            }
                          }}
                          className={`py-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center whitespace-nowrap ${
                            isActiveWip 
                              ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60'
                          }`}
                          title="Set Active Treatment"
                        >
                          🔴 WIP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (roleLower === 'doctor' || roleLower === 'owner') {
                              handleBedStatus(bed._id, 'cleaning');
                            }
                          }}
                          className={`py-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center whitespace-nowrap ${
                            isActiveCleaning 
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60'
                          }`}
                          title="Set Cleaning"
                        >
                          🟡 Clean
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Analytics trend chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Daily Branch Trends
              </h2>
              <p className="text-xs text-slate-500">Patient count metrics (Past 7 days)</p>
            </div>

            <div className="h-44 w-full">
              {stats.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorConsults" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="consultations" name="Patients" stroke="#4f46e5" fillOpacity={1} fill="url(#colorConsults)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-mono">
                  Waiting for analytical aggregate runs...
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
