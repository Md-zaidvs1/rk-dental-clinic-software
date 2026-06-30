import React, { useState, useEffect } from 'react';
import { 
  History, User, Calendar, Check, ShieldAlert, FileText, 
  Plus, Layers, Activity, ChevronRight, DollarSign, Bug, 
  Trash2, Printer, Download, ZoomIn, ZoomOut, Maximize2,
  Paperclip, Image as ImageIcon, Sparkles, RefreshCw
} from 'lucide-react';

const FDI_TO_UNIVERSAL_ADULT = {
  '18': '1', '17': '2', '16': '3', '15': '4', '14': '5', '13': '6', '12': '7', '11': '8',
  '21': '9', '22': '10', '23': '11', '24': '12', '25': '13', '26': '14', '27': '15', '28': '16',
  '38': '17', '37': '18', '36': '19', '35': '20', '34': '21', '33': '22', '32': '23', '31': '24',
  '41': '25', '42': '26', '43': '27', '44': '28', '45': '29', '46': '30', '47': '31', '48': '32'
};

const FDI_TO_UNIVERSAL_PEDO = {
  '55': 'A', '54': 'B', '53': 'C', '52': 'D', '51': 'E',
  '61': 'F', '62': 'G', '63': 'H', '64': 'I', '65': 'J',
  '71': 'K', '72': 'L', '73': 'M', '74': 'N', '75': 'O',
  '85': 'P', '84': 'Q', '83': 'R', '82': 'S', '81': 'T'
};

const TOOTH_NAMES = {
  // Adult
  '11': 'Upper Right Central Incisor', '12': 'Upper Right Lateral Incisor', '13': 'Upper Right Canine', '14': 'Upper Right First Premolar', '15': 'Upper Right Second Premolar', '16': 'Upper Right First Molar', '17': 'Upper Right Second Molar', '18': 'Upper Right Third Molar (Wisdom)',
  '21': 'Upper Left Central Incisor', '22': 'Upper Left Lateral Incisor', '23': 'Upper Left Canine', '24': 'Upper Left First Premolar', '25': 'Upper Left Second Premolar', '26': 'Upper Left First Molar', '27': 'Upper Left Second Molar', '28': 'Upper Left Third Molar (Wisdom)',
  '31': 'Lower Left Central Incisor', '32': 'Lower Left Lateral Incisor', '33': 'Lower Left Canine', '34': 'Lower Left First Premolar', '35': 'Lower Left Second Premolar', '36': 'Lower Left First Molar', '37': 'Lower Left Second Molar', '38': 'Lower Left Third Molar (Wisdom)',
  '41': 'Lower Right Central Incisor', '42': 'Lower Right Lateral Incisor', '43': 'Lower Right Canine', '44': 'Lower Right First Premolar', '45': 'Lower Right Second Premolar', '46': 'Lower Right First Molar', '47': 'Lower Right Second Molar', '48': 'Lower Right Third Molar (Wisdom)',
  // Primary / Pediatric
  '51': 'Primary Upper Right Central Incisor', '52': 'Primary Upper Right Lateral Incisor', '53': 'Primary Upper Right Canine', '54': 'Primary Upper Right First Molar', '55': 'Primary Upper Right Second Molar',
  '61': 'Primary Upper Left Central Incisor', '62': 'Primary Upper Left Lateral Incisor', '63': 'Primary Upper Left Canine', '64': 'Primary Upper Left First Molar', '65': 'Primary Upper Left Second Molar',
  '71': 'Primary Lower Left Central Incisor', '72': 'Primary Lower Left Lateral Incisor', '73': 'Primary Lower Left Canine', '74': 'Primary Lower Left First Molar', '75': 'Primary Lower Left Second Molar',
  '81': 'Primary Lower Right Central Incisor', '82': 'Primary Lower Right Lateral Incisor', '83': 'Primary Lower Right Canine', '84': 'Primary Lower Right First Molar', '85': 'Primary Lower Right Second Molar'
};

const TREATMENT_STATES = [
  { name: 'Healthy', cost: 0, desc: 'Healthy functional tooth structure' },
  { name: 'Caries', cost: 0, desc: 'Tooth decay or dental caries present' },
  { name: 'Filling', cost: 1800, desc: 'Composite filling restoration' },
  { name: 'Root Canal', cost: 4500, desc: 'Endodontic Root Canal Therapy (RCT)' },
  { name: 'Crown', cost: 3500, desc: 'Prosthodontic protective ceramic/metal crown' },
  { name: 'Extraction', cost: 1500, desc: 'Surgical tooth removal' },
  { name: 'Implant', cost: 25000, desc: 'Titanium root fixture & crown replacement' },
  { name: 'Bridge', cost: 12000, desc: 'Multi-unit fixed partial denture bridge' },
  { name: 'Scaling', cost: 1200, desc: 'Prophylactic calculus scaling and root planing' },
  { name: 'Denture', cost: 8000, desc: 'Removable acrylic or metal partial/complete denture' },
  { name: 'Veneer', cost: 10000, desc: 'Aesthetic porcelain cosmetic veneer restoration' },
];

const STATUS_COLORS = {
  'Healthy': { bg: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  'Caries': { bg: 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 ring-amber-200', dot: 'bg-amber-500' },
  'Filling': { bg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 ring-emerald-200', dot: 'bg-emerald-500' },
  'Root Canal': { bg: 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300 ring-red-200', dot: 'bg-red-500' },
  'Crown': { bg: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300 ring-indigo-200', dot: 'bg-indigo-500' },
  'Extraction': { bg: 'bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300 ring-orange-200', dot: 'bg-orange-500' },
  'Implant': { bg: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border-cyan-300 ring-cyan-200', dot: 'bg-cyan-500' },
  'Bridge': { bg: 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 ring-purple-200', dot: 'bg-purple-500' },
  'Scaling': { bg: 'bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-300 ring-teal-200', dot: 'bg-teal-500' },
  'Denture': { bg: 'bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 border-fuchsia-300 ring-fuchsia-200', dot: 'bg-fuchsia-500' },
  'Veneer': { bg: 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 ring-rose-200', dot: 'bg-rose-500' },
};

// Adult Tooth Lists
const ADULT_UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const ADULT_UPPER_LEFT  = ['21', '22', '23', '24', '25', '26', '27', '28'];
const ADULT_LOWER_LEFT  = ['31', '32', '33', '34', '35', '36', '37', '38'];
const ADULT_LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];

// Pediatric Tooth Lists
const PEDO_UPPER_RIGHT = ['55', '54', '53', '52', '51'];
const PEDO_UPPER_LEFT  = ['61', '62', '63', '64', '65'];
const PEDO_LOWER_LEFT  = ['71', '72', '73', '74', '75'];
const PEDO_LOWER_RIGHT = ['85', '84', '83', '82', '81'];

export default function AdvancedDentalChart({ patientId, token, user, onTreatmentAdded }) {
  const isReceptionist = user?.role === 'receptionist';

  // Config State
  const [dentition, setDentition] = useState('Adult'); // 'Adult' | 'Pedo' | 'Mixed'
  const [numberingSystem, setNumberingSystem] = useState('FDI'); // 'FDI' | 'Universal'
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  
  // Selection State
  const [selectedTeeth, setSelectedTeeth] = useState([]); // Array of string FDI numbers
  const [hoveredTooth, setHoveredTooth] = useState(null);

  // DB Data State
  const [chartData, setChartData] = useState({}); // Map of fdi -> { status, notes }
  const [historyList, setHistoryList] = useState([]); // Full array of toothHistories
  const [reportsList, setReportsList] = useState([]); // Available reports for linking
  const [linkedReports, setLinkedReports] = useState({}); // Map of fdi -> array of reportIds

  // Form State
  const [selectedStatus, setSelectedStatus] = useState('Healthy');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Quick Estimates state (to visualize treatment estimate)
  const [estimates, setEstimates] = useState([]);

  // Load patient chart and history
  const loadChartAndHistory = async () => {
    if (!patientId || !token) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/dental-chart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Build chartData mapping
        const chartMap = {};
        data.chart.forEach(item => {
          chartMap[item.toothNumber] = {
            status: item.status,
            notes: item.notes,
            linkedReports: item.linkedReports || []
          };
        });
        setChartData(chartMap);
        setHistoryList(data.history || []);
        
        // Populate linked reports
        const linkedMap = {};
        data.chart.forEach(item => {
          if (item.linkedReports && item.linkedReports.length > 0) {
            linkedMap[item.toothNumber] = item.linkedReports;
          }
        });
        setLinkedReports(linkedMap);
      }
    } catch (err) {
      console.error('Error fetching dental chart data:', err);
    }
  };

  // Load available radiological reports
  const loadReports = async () => {
    if (!patientId || !token) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReportsList(data.data || []);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  };

  useEffect(() => {
    loadChartAndHistory();
    loadReports();
    setSelectedTeeth([]);
  }, [patientId, token]);

  const handleToothClick = (toothNum) => {
    if (isMultiSelect) {
      if (selectedTeeth.includes(toothNum)) {
        setSelectedTeeth(selectedTeeth.filter(t => t !== toothNum));
      } else {
        setSelectedTeeth([...selectedTeeth, toothNum]);
      }
    } else {
      if (selectedTeeth.includes(toothNum)) {
        setSelectedTeeth([]);
      } else {
        setSelectedTeeth([toothNum]);
        // Set form to this tooth's current state
        const current = chartData[toothNum];
        setSelectedStatus(current?.status || 'Healthy');
        setClinicalNotes(current?.notes || '');
      }
    }
  };

  const getToothDisplayLabel = (fdiNum) => {
    if (numberingSystem === 'FDI') {
      return fdiNum;
    }
    // Return Universal mapping
    if (FDI_TO_UNIVERSAL_ADULT[fdiNum]) {
      return FDI_TO_UNIVERSAL_ADULT[fdiNum];
    }
    if (FDI_TO_UNIVERSAL_PEDO[fdiNum]) {
      return FDI_TO_UNIVERSAL_PEDO[fdiNum];
    }
    return fdiNum;
  };

  const saveToothState = async () => {
    if (selectedTeeth.length === 0 || isSaving || !token) return;
    setIsSaving(true);

    try {
      // Post states for each selected tooth
      for (const toothNum of selectedTeeth) {
        const statePayload = {
          toothNumber: toothNum,
          status: selectedStatus,
          notes: clinicalNotes,
          reportId: selectedReportId || null
        };

        const res = await fetch(`/api/patients/${patientId}/dental-chart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(statePayload)
        });
        const data = await res.json();

        if (data.success) {
          // If a procedure state was saved with a cost > 0, notify parent (Doctor Workspace) to add a clinical procedure
          const activeStateObj = TREATMENT_STATES.find(ts => ts.name === selectedStatus);
          if (activeStateObj && activeStateObj.cost > 0 && onTreatmentAdded) {
            onTreatmentAdded({
              type: `${selectedStatus} (Tooth ${getToothDisplayLabel(toothNum)})`,
              tooth: toothNum,
              cost: activeStateObj.cost
            });
          }
        }
      }

      // Success cleanup
      setClinicalNotes('');
      setSelectedReportId('');
      if (!isMultiSelect) {
        setSelectedTeeth([]);
      }
      await loadChartAndHistory();
    } catch (err) {
      console.error('Error saving tooth status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter history items based on selected teeth
  const activeHistory = selectedTeeth.length > 0 
    ? historyList.filter(h => selectedTeeth.includes(h.toothNumber))
    : historyList;

  // FDI lists determined by dentition mode
  const renderToothRow = (list, title) => {
    return (
      <div className="flex flex-col items-center space-y-1 bg-slate-50/40 p-2.5 rounded-2xl border border-slate-100">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="flex justify-center items-center gap-1 flex-wrap">
          {list.map(fdiNum => {
            const label = getToothDisplayLabel(fdiNum);
            const state = chartData[fdiNum] || { status: 'Healthy' };
            const isSelected = selectedTeeth.includes(fdiNum);
            const colorObj = STATUS_COLORS[state.status] || STATUS_COLORS['Healthy'];
            const hasHistory = historyList.some(h => h.toothNumber === fdiNum);
            const reportsLinkedCount = linkedReports[fdiNum]?.length || 0;

            let borderClass = colorObj.border;
            let bgClass = colorObj.bg;

            if (isSelected) {
              borderClass = 'border-indigo-600 ring-2 ring-indigo-300';
              bgClass = 'bg-indigo-100 text-indigo-900';
            }

            return (
              <button
                key={fdiNum}
                type="button"
                onClick={() => handleToothClick(fdiNum)}
                onMouseEnter={() => setHoveredTooth(fdiNum)}
                onMouseLeave={() => setHoveredTooth(null)}
                style={{ boxSizing: 'border-box', pointerEvents: 'auto' }}
                className={`w-9 h-11 text-xs font-mono font-bold flex flex-col items-center justify-between p-1 rounded-xl border shadow-sm transition relative select-none hover:shadow-[inset_0_0_0_2px_rgba(99,102,241,0.5)] ${bgClass} ${borderClass}`}
              >
                <span className="text-[9px] text-slate-400 font-sans tracking-tight">
                  {fdiNum}
                </span>
                <span className="text-[11px] mt-0.5">{label}</span>
                
                {/* Dots / Indicators */}
                <div className="flex gap-0.5 justify-center w-full mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${colorObj.dot}`} title={`Status: ${state.status}`}></span>
                  {hasHistory && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" title="Has medical history"></span>
                  )}
                  {reportsLinkedCount > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${reportsLinkedCount} radiograph linked`}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-sans space-y-6">
      
      {/* Visual Header & Toolbar */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold font-display flex items-center gap-2 text-indigo-400">
            <Activity className="w-5 h-5 text-indigo-400" /> Professional Advanced Dental Chart
          </h3>
          <p className="text-xs text-slate-300 mt-1">Multi-dentition FDI-Universal clinical tooth mapping & radiology linking</p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-800">
          {/* Dentition mode */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-white gap-1 border border-slate-700">
            {['Adult', 'Pedo', 'Mixed'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setDentition(mode)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                  dentition === mode 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Numbering system */}
          <div className="flex bg-slate-800 p-1 rounded-xl text-white gap-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setNumberingSystem('FDI')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                numberingSystem === 'FDI' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FDI System
            </button>
            <button
              type="button"
              onClick={() => setNumberingSystem('Universal')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                numberingSystem === 'Universal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Universal System
            </button>
          </div>

          {/* Multi-select Mode */}
          <button
            type="button"
            onClick={() => {
              setIsMultiSelect(!isMultiSelect);
              setSelectedTeeth([]);
            }}
            className={`px-4 py-2 rounded-xl transition ${
              isMultiSelect 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {isMultiSelect ? 'Multi-Select Active' : 'Single Select Mode'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hover Tooth Detail Alert */}
        {hoveredTooth && (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center text-xs text-indigo-900 transition-all">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
              <span>
                <strong>Tooth {getToothDisplayLabel(hoveredTooth)} (FDI {hoveredTooth})</strong>: {TOOTH_NAMES[hoveredTooth] || 'Molar'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="px-2 py-0.5 bg-indigo-200 rounded text-indigo-800 uppercase font-bold text-[10px]">
                {chartData[hoveredTooth]?.status || 'Healthy'}
              </span>
              {chartData[hoveredTooth]?.notes && (
                <span className="text-slate-500 truncate max-w-xs font-normal">
                  - "{chartData[hoveredTooth].notes}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Visual Charts Grid */}
        <div className="space-y-4">
          
          {/* Upper Arch (Upper Jaw) */}
          {(dentition === 'Adult' || dentition === 'Mixed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToothRow(ADULT_UPPER_RIGHT, 'Upper Right Adult Quadrant')}
              {renderToothRow(ADULT_UPPER_LEFT, 'Upper Left Adult Quadrant')}
            </div>
          )}

          {/* Pediatric Upper Arch */}
          {(dentition === 'Pedo' || dentition === 'Mixed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-indigo-100 pb-4">
              {renderToothRow(PEDO_UPPER_RIGHT, 'Upper Right Pediatric Quadrant')}
              {renderToothRow(PEDO_UPPER_LEFT, 'Upper Left Pediatric Quadrant')}
            </div>
          )}

          {/* Pediatric Lower Arch */}
          {(dentition === 'Pedo' || dentition === 'Mixed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToothRow(PEDO_LOWER_RIGHT, 'Lower Right Pediatric Quadrant')}
              {renderToothRow(PEDO_LOWER_LEFT, 'Lower Left Pediatric Quadrant')}
            </div>
          )}

          {/* Lower Arch (Lower Jaw) */}
          {(dentition === 'Adult' || dentition === 'Mixed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderToothRow(ADULT_LOWER_RIGHT, 'Lower Right Adult Quadrant')}
              {renderToothRow(ADULT_LOWER_LEFT, 'Lower Left Adult Quadrant')}
            </div>
          )}
        </div>

        {/* Selected Teeth Control Form Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-100 pt-6">
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Current Selection
            </h4>
            
            {selectedTeeth.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center text-xs text-slate-400 font-medium">
                Click tooth/teeth in chart above to diagnosis or schedule procedures.
              </div>
            ) : (
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-3 text-xs">
                <div>
                  <span className="font-extrabold text-slate-700 block">Active Teeth Selected ({selectedTeeth.length}):</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTeeth.map(num => (
                      <span key={num} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl font-bold font-mono">
                        Tooth {getToothDisplayLabel(num)}
                      </span>
                    ))}
                  </div>
                </div>

                {isReceptionist ? (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-rose-700 font-semibold text-[11px]">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> View-only access: Receptionists cannot modify dental charts.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Select treatment state */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Set Tooth Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                      >
                        {TREATMENT_STATES.map(state => (
                          <option key={state.name} value={state.name}>
                            {state.name} {state.cost > 0 ? `(Est: ₹${state.cost})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Report linking */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Link Radiograph / RVG</label>
                      <select
                        value={selectedReportId}
                        onChange={(e) => setSelectedReportId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="">-- No Image Linked --</option>
                        {reportsList.map(rep => (
                          <option key={rep._id} value={rep._id}>
                            {rep.reportType} - {rep.title || 'Report'} ({new Date(rep.uploadedDate).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Diagnosis notes */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Clinical Diagnosis Notes</label>
                      <textarea
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="Insert specific tooth caries detail, fracture patterns or advising details..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-[11px] h-16 resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={saveToothState}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm transition"
                    >
                      {isSaving ? 'Saving...' : 'Save Diagnosis & Estimate'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History Timeline */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" /> Tooth History Timeline {selectedTeeth.length > 0 ? `(Filtered)` : `(Comprehensive)`}
            </h4>

            {activeHistory.length === 0 ? (
              <div className="p-8 border border-slate-100 bg-slate-50/20 rounded-3xl text-center text-xs text-slate-400 italic">
                No procedures or statuses logged in patient history for {selectedTeeth.length > 0 ? 'the selected teeth' : 'any tooth'}.
              </div>
            ) : (
              <div className="border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-100 text-xs bg-white max-h-[350px] overflow-y-auto">
                {activeHistory.map((h) => {
                  const label = getToothDisplayLabel(h.toothNumber);
                  const isFiltered = selectedTeeth.includes(h.toothNumber);
                  return (
                    <div key={h._id} className={`p-4 transition ${isFiltered ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-extrabold text-[10px]">
                              Tooth {label}
                            </span>
                            <span className="font-extrabold text-slate-800">{h.procedure || h.diagnosis}</span>
                          </div>
                          
                          <p className="text-slate-600 font-medium mt-1">{h.notes || 'No specific doctor notes recorded.'}</p>
                          
                          {/* Attached Reports */}
                          {h.attachments && h.attachments.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Linked Radiographs:</span>
                              {h.attachments.map(attId => {
                                const report = reportsList.find(r => r._id === attId);
                                return (
                                  <span key={attId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] rounded-lg font-bold">
                                    <ImageIcon className="w-3 h-3" /> {report?.reportType || 'Radiograph'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-1 text-[10px] font-mono text-slate-400">
                          <div className="flex items-center gap-1 justify-end font-bold text-slate-500">
                            <User className="w-3 h-3" /> {h.doctor || 'Doctor'}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Calendar className="w-3 h-3" /> {new Date(h.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
