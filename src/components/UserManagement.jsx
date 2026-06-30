import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Check, AlertCircle, RefreshCw, KeyRound, CheckSquare, Square } from 'lucide-react';

export default function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('receptionist');
  const [branchId, setBranchId] = useState('branch-venpakkam');

  // Edit states
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('receptionist');
  const [editBranchId, setEditBranchId] = useState('branch-venpakkam');
  const [editPassword, setEditPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name || !username || !password) {
      setErrorMsg('All fields are required to register staff.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, username, password, role, branchId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Clinical account for ${name} successfully created!`);
        setName('');
        setUsername('');
        setPassword('');
        loadUsers();
      } else {
        setErrorMsg(data.message || 'Failed to create staff account.');
      }
    } catch (err) {
      setErrorMsg('Server connection error.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          branchId: editBranchId,
          password: editPassword || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Staff details updated for ${editName}.`);
        setEditingUser(null);
        setEditPassword('');
        loadUsers();
      } else {
        setErrorMsg(data.message || 'Failed to update details.');
      }
    } catch (err) {
      setErrorMsg('Server connection error.');
    }
  };

  const toggleUserActive = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleStartEdit = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditBranchId(user.branchId);
    setEditPassword('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">User & Staff Management</h2>
        <p className="text-xs text-slate-400">Manage clinical logins, roles, branch assignments, and toggle active status (Owner Access only)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (Create or Edit) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          {!editingUser ? (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Register New Staff</h3>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Radhakrishnan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login Username</label>
                  <input
                    type="text"
                    placeholder="e.g. radhakrishnan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700"
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin / Owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Branch</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none text-slate-600"
                    >
                      <option value="branch-venpakkam">Venpakkam</option>
                      <option value="branch-kalavai">Kalavai</option>
                    </select>
                  </div>
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
                  Create Clinical Account
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Edit Staff details</h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                <div className="space-y-1 font-mono text-[10px] text-slate-400">
                  <span>Modifying Account: @{editingUser.username}</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Change Password (leave blank to keep)</label>
                  <input
                    type="password"
                    placeholder="New Password (optional)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-700"
                    >
                      <option value="receptionist">Receptionist</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin / Owner</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default Branch</label>
                    <select
                      value={editBranchId}
                      onChange={(e) => setEditBranchId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none text-slate-600"
                    >
                      <option value="branch-venpakkam">Venpakkam</option>
                      <option value="branch-kalavai">Kalavai</option>
                    </select>
                  </div>
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
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Save Account Changes
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Column: User Logins list */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-3">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Active Staff Accounts ({users.length})</h3>
          </div>

          {loading ? (
            <p className="text-center text-slate-400 py-12 text-xs">Loading accounts...</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {users.map((u) => {
                const branchLabel = u.branchId === 'branch-venpakkam' ? 'Venpakkam' : 'Kalavai';
                return (
                  <div key={u._id} className="py-3 flex justify-between items-center hover:bg-slate-50/40 px-2 rounded-xl transition gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 text-xs">{u.name}</strong>
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {u.role}
                        </span>
                        {u.isActive ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Active</span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold">Inactive</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Username: @{u.username} · Branch: {branchLabel}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                      >
                        Modify
                      </button>

                      {u.username !== 'doctor' && u.username !== 'receptionist' && (
                        <button
                          onClick={() => toggleUserActive(u._id)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${
                            u.isActive 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
