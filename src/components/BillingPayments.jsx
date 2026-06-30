import React, { useState, useEffect } from 'react';
import { Search, Check, Printer, Plus, Trash2 } from 'lucide-react';

export default function BillingPayments({ token, activePatientFromDashboard }) {
  const [activePatient, setActivePatient] = useState(null);

  // Search patients for billing
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Line items inside active bill
  const [lineItems, setLineItems] = useState([
    { serviceId: 'svc-rct', description: 'Root Canal Treatment', qty: 1, rate: 4500 }
  ]);
  const [customDescription, setCustomDescription] = useState('Consultation Fee');
  const [customRate, setCustomRate] = useState('500');

  // Adjustments
  const [discountAmount, setDiscountAmount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('180');

  // Created Bill state
  const [activeBill, setActiveBill] = useState(null);

  // Payment collection state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (activePatientFromDashboard) {
      setActivePatient(activePatientFromDashboard);
    }
  }, [activePatientFromDashboard]);

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

  const handleSelectPatient = (p) => {
    setActivePatient(p);
    setSearchQuery('');
    setSearchResults([]);
    setActiveBill(null);
    setPaymentSuccess(false);
    setLineItems([
      { serviceId: 'svc-rct', description: 'Root Canal Treatment', qty: 1, rate: 4500 }
    ]);
  };

  const addLineItem = () => {
    if (!customDescription.trim() || !customRate) return;
    setLineItems([...lineItems, {
      serviceId: `svc-custom-${Date.now()}`,
      description: customDescription,
      qty: 1,
      rate: Number(customRate)
    }]);
    setCustomDescription('');
    setCustomRate('500');
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleCreateBill = async () => {
    if (!activePatient) return;
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: activePatient._id,
          lineItems,
          discountAmount: Number(discountAmount),
          taxAmount: Number(taxAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveBill(data.data);
        setPaymentAmount(data.data.totalAmount.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCollectPayment = async () => {
    if (!activeBill) return;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billId: activeBill._id,
          amount: Number(paymentAmount),
          paymentMode,
          transactionRef
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        // Reload bill details
        const resBill = await fetch(`/api/bills/${activeBill._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataBill = await resBill.json();
        if (dataBill.success) {
          setActiveBill(dataBill.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {!activePatient ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Load Patient for Billing</h3>
            <p className="text-xs text-slate-400">Search for patients to create an invoice, track due balance, or collect clinical payments</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient..."
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
          {/* Create invoice inputs (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-indigo-600 font-extrabold font-mono uppercase tracking-widest">Invoice Terminal</span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activePatient.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">ID: {activePatient.patientId} | Phone: {activePatient.mobile}</p>
              </div>
              <button
                onClick={() => setActivePatient(null)}
                className="text-xs text-slate-500 hover:text-indigo-600 font-bold"
              >
                Change Patient
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <span className="font-bold text-slate-700 block">Procedure Items List</span>
              
              <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 text-slate-600 font-medium">
                    <span>{item.description}</span>
                    <div className="flex items-center gap-3">
                      <strong>₹{item.rate}</strong>
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Service Description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Rate (₹)"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addLineItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              {/* Discount / Taxes */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Tax Additions (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBill}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition"
              >
                Compile and Generate Invoice Draft
              </button>
            </div>
          </div>

          {/* Payment collection terminal (5 cols) */}
          <div className="lg:col-span-5 border border-slate-100 p-6 rounded-2xl bg-slate-50/50 space-y-6">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Payment Collection Desk</h4>
              <p className="text-[10px] text-slate-400">Post transactions and track commercial invoice status</p>
            </div>

            {activeBill ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-2.5 bg-white p-4 rounded-xl border border-slate-150 text-slate-600 leading-relaxed font-sans shadow-inner">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span>Invoice Code:</span>
                    <strong className="text-slate-900">{activeBill.invoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <strong className="text-slate-900">₹{activeBill.subtotal}</strong>
                  </div>
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount:</span>
                    <strong>-₹{activeBill.discountAmount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <strong>+₹{activeBill.taxAmount}</strong>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total Due:</span>
                    <span>₹{activeBill.totalAmount}</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                  <p className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className={`uppercase font-extrabold text-[10px] px-2 py-0.5 rounded ${
                      activeBill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {activeBill.status}
                    </span>
                  </p>
                </div>

                {activeBill.status !== 'paid' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Collection Payment Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['upi', 'cash', 'card'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPaymentMode(mode)}
                            className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition ${
                              paymentMode === mode
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Received Amount (₹)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Transaction Ref / UPI ID</label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                        placeholder="e.g. UPI txn identifier"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCollectPayment}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      Collect and Synchronize Transaction
                    </button>
                  </div>
                )}

                {paymentSuccess && activeBill.status === 'paid' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col gap-2">
                    <p className="font-bold text-emerald-800 text-[11px] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" /> Transaction Recorded
                    </p>
                    <p className="text-[10px] text-slate-500">Invoice finalized. Click buttons below to print or share the invoice sheet.</p>
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => {
                          if (window.electronAPI && typeof window.electronAPI.print === 'function') {
                            window.electronAPI.print();
                          } else {
                            window.print();
                          }
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] transition flex justify-center items-center gap-1"
                      >
                        <Printer className="w-4 h-4" /> Print Commercial Invoice
                      </button>
                      <button
                        onClick={() => {
                          const patientObj = patients.find(p => p._id === selectedPatientId);
                          const patientName = patientObj ? patientObj.name : 'Valued Patient';
                          const patientPhone = patientObj ? patientObj.mobile : '';
                          const message = `Hello ${patientName}, here is your billing receipt from RK Dental Clinic:\n` + 
                            `Invoice ID: ${activeBill.invoiceNumber}\n` + 
                            `Total Amount: ₹${activeBill.totalAmount}\n` + 
                            `Payment Method: ${paymentMethod.toUpperCase()}\n` + 
                            `Status: PAID\nThank you for choosing RK Dental Clinic!`;
                          if (window.electronAPI && typeof window.electronAPI.shareWhatsApp === 'function') {
                            window.electronAPI.shareWhatsApp({ phone: patientPhone, message });
                          } else {
                            window.open(`https://wa.me/${patientPhone}?text=${encodeURIComponent(message)}`, '_blank');
                          }
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] transition flex justify-center items-center gap-1"
                      >
                        Share via WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Fill in service details and click compile button to load transaction controls.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
