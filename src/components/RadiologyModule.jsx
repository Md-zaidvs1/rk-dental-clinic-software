import React, { useState, useEffect } from 'react';
import { 
  FileText, ImageIcon, Download, Trash2, Printer, 
  ZoomIn, ZoomOut, Maximize2, ShieldAlert, Check, 
  Upload, Sparkles, X, Plus, Clock, User, Building, Clipboard 
} from 'lucide-react';

export default function RadiologyModule({ patientId, token, user }) {
  const isReceptionist = user?.role === 'receptionist';
  const branchName = user?.branchName || 'Main Branch';

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeReport, setActiveReport] = useState(null); // Full Screen modal report
  const [zoomScale, setZoomScale] = useState(1);

  // Upload Form States
  const [uploadType, setUploadType] = useState('RVG'); // 'RVG' | 'OPG' | 'CBCT' | 'Intraoral' | 'PDF' | 'Lab'
  const [title, setTitle] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [base64File, setBase64File] = useState('');
  const [fileName, setFileName] = useState('');

  const loadReports = async () => {
    if (!patientId || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching patient reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    setUploadError('');
    setUploadSuccess('');
    setBase64File('');
    setFileName('');
    setTitle('');
    setReportNotes('');
  }, [patientId, token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setUploadError('');

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size is too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64File(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (isReceptionist) return;
    if (!base64File) {
      setUploadError('Please select or drag a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await fetch(`/api/patients/${patientId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: uploadType,
          title: title || `${uploadType} Scan`,
          notes: reportNotes,
          fileData: base64File,
          fileName: fileName,
          branch: branchName
        })
      });
      const data = await res.json();
      if (data.success) {
        setUploadSuccess('Radiology file uploaded and synced successfully!');
        setBase64File('');
        setFileName('');
        setTitle('');
        setReportNotes('');
        await loadReports();
      } else {
        setUploadError(data.message || 'Failed to upload report');
      }
    } catch (err) {
      setUploadError('Network error uploading radiology report.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (isReceptionist) return;
    if (!window.confirm('Are you absolutely sure you want to delete this report? This is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/patients/${patientId}/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (activeReport?._id === reportId) {
          setActiveReport(null);
        }
        await loadReports();
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  const handleUpdateNotes = async (reportId, newNotes) => {
    if (isReceptionist) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/reports/${reportId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: newNotes })
      });
      const data = await res.json();
      if (data.success) {
        if (activeReport?._id === reportId) {
          setActiveReport({ ...activeReport, notes: newNotes });
        }
        await loadReports();
      }
    } catch (err) {
      console.error('Error updating report notes:', err);
    }
  };

  const triggerDownload = (report) => {
    const link = document.createElement('a');
    link.href = report.fileUrl;
    link.download = report.fileName || `${report.reportType}_Report.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrint = (report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; margin-top: 20px; }
            .header { margin-bottom: 20px; text-align: left; }
            h1 { margin: 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RK Dental Clinic Radiology</h1>
            <p><strong>Patient:</strong> ${patientId}</p>
            <p><strong>Type:</strong> ${report.reportType} | <strong>Date:</strong> ${new Date(report.uploadedDate).toLocaleDateString()}</p>
            <p><strong>Clinical Notes:</strong> ${report.notes || 'N/A'}</p>
          </div>
          <hr/>
          ${report.fileUrl.startsWith('data:application/pdf') 
            ? `<p>PDF Report - Please download the document to view.</p>` 
            : `<img src="${report.fileUrl}" />`}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-sans space-y-6 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" /> Radiology, RVG & Patient Reports
          </h3>
          <p className="text-xs text-slate-500 mt-1">Manage RVG, OPG, CBCT scans, laboratory files, and PDF diagnostics</p>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
          Total: {reports.length} Reports
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Panel (4 columns) */}
        <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-100/60 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Upload className="w-4 h-4 text-indigo-600" /> Upload Report
            </h4>
            {isReceptionist && (
              <span className="text-[9px] font-extrabold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase">
                View Only
              </span>
            )}
          </div>

          {isReceptionist ? (
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-[11px] text-rose-800 space-y-2 font-medium">
              <p className="flex items-center gap-1.5 font-bold"><ShieldAlert className="w-4 h-4 text-rose-600" /> Access Restrictions</p>
              <p>Your receptionist profile does not permit clinical document uploads. Please coordinate with an attending dental specialist.</p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              {/* Type selection */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1">Report Classification</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['RVG', 'OPG', 'CBCT', 'Intraoral', 'PDF', 'Lab'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className={`py-1.5 border rounded-lg text-center font-bold ${
                        uploadType === type 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lower Right Wisdom Root RVG"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 mb-1">Attending Specialist Notes</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Insert specific annotations, e.g. Deep pocket on Tooth 16 advised RCT..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-[11px] h-20 resize-none"
                />
              </div>

              {/* File picker */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-100/50 transition relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-700">Drag file or click to select</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Supports OPG/RVG PNG, JPG or PDF up to 10MB</p>
                {fileName && (
                  <p className="text-[10px] text-indigo-600 mt-2 font-mono truncate max-w-full">
                    Selected: {fileName}
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-600" /> {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <Check className="w-4.5 h-4.5 text-emerald-600" /> {uploadSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow transition"
              >
                {isUploading ? 'Uploading & Syncing...' : 'Upload & Link'}
              </button>
            </form>
          )}
        </div>

        {/* Gallery / List Panel (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clipboard className="w-4 h-4 text-indigo-600" /> Uploaded Document Inventory
          </h4>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
              Retrieving radiography vaults from clinic node...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center border border-slate-100 rounded-3xl text-xs text-slate-400 italic">
              No digital radiographs, RVGs, or laboratory files uploaded for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reports.map(report => {
                const isPdf = report.fileUrl?.startsWith('data:application/pdf') || report.fileName?.endsWith('.pdf');
                return (
                  <div key={report._id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition">
                    
                    {/* Visual Preview Header */}
                    <div className="bg-slate-100 h-32 relative flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => setActiveReport(report)}>
                      {isPdf ? (
                        <div className="text-center p-4">
                          <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                          <span className="text-[10px] font-extrabold text-slate-500 font-mono mt-1 block">PDF Document</span>
                        </div>
                      ) : (
                        <img 
                          src={report.fileUrl} 
                          alt={report.title} 
                          className="object-cover w-full h-full hover:scale-110 transition duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[9px] font-extrabold px-2 py-0.5 rounded">
                        {report.reportType}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 space-y-2 text-xs">
                      <div>
                        <h5 className="font-extrabold text-slate-800 leading-tight truncate" title={report.title}>{report.title}</h5>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(report.uploadedDate).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Notes Input / Preview */}
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50 space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase">Findings & Notes:</span>
                        {isReceptionist ? (
                          <p className="text-[10px] text-slate-600 line-clamp-2 italic">{report.notes || 'No annotations.'}</p>
                        ) : (
                          <textarea
                            defaultValue={report.notes}
                            onBlur={(e) => handleUpdateNotes(report._id, e.target.value)}
                            placeholder="Add findings notes..."
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[10px] text-slate-700 h-10 resize-none font-medium leading-normal"
                          />
                        )}
                      </div>

                      {/* Footer Details */}
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-slate-50 pt-2 flex-wrap gap-1">
                        <span className="flex items-center gap-1 font-bold text-slate-500"><User className="w-2.5 h-2.5" /> {report.uploadedBy || 'Doctor'}</span>
                        <span className="flex items-center gap-1"><Building className="w-2.5 h-2.5" /> {report.branch || 'Branch'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between gap-1 border-t border-slate-50 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveReport(report)}
                          className="flex-1 py-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold flex justify-center items-center gap-1 text-[10px]"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-slate-500" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload(report)}
                          className="py-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                          title="Download radiology scan"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerPrint(report)}
                          className="py-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                          title="Print report format"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {!isReceptionist && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReport(report._id)}
                            className="py-1 px-2 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600"
                            title="Delete file permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Full Screen Image Preview Modal with Zoom, Download, Delete, Print */}
      {activeReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans">
          
          {/* Modal Header */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 w-full max-w-5xl mx-auto shadow-2xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                  {activeReport.reportType}
                </span>
                <h4 className="font-extrabold text-sm sm:text-base leading-tight">{activeReport.title}</h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Uploaded by {activeReport.uploadedBy} @ {activeReport.branch} on {new Date(activeReport.uploadedDate).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveReport(null);
                setZoomScale(1);
              }}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Image Body with Zoom Capability */}
          <div className="flex-1 flex items-center justify-center overflow-auto py-6">
            <div className="relative border border-slate-800 bg-slate-900 p-2.5 rounded-3xl overflow-hidden shadow-2xl max-h-[70vh] flex items-center justify-center">
              {activeReport.fileUrl?.startsWith('data:application/pdf') ? (
                <div className="text-center p-12 text-white max-w-md">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                  <h5 className="font-bold text-base">PDF Document Render Restricted</h5>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Radiology file uploaded in PDF format. Please leverage the print or download utility to inspect.
                  </p>
                </div>
              ) : (
                <div 
                  className="transition-transform duration-150 origin-center"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <img 
                    src={activeReport.fileUrl} 
                    alt={activeReport.title} 
                    className="object-contain max-h-[60vh] max-w-full rounded-2xl" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Modal Bottom toolbar / notes summary */}
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 w-full max-w-5xl mx-auto space-y-3 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Report Annotation */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Specialist Annotations & Findings</span>
                {isReceptionist ? (
                  <p className="text-xs text-slate-300 italic font-medium leading-relaxed bg-slate-850 p-2.5 rounded-xl border border-slate-800">{activeReport.notes || 'No notes added.'}</p>
                ) : (
                  <textarea
                    defaultValue={activeReport.notes}
                    onBlur={(e) => handleUpdateNotes(activeReport._id, e.target.value)}
                    placeholder="Update notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl focus:outline-none text-xs p-2.5 text-slate-200 h-16 resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Action utilities */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
                {/* Zoom tools */}
                {!activeReport.fileUrl?.startsWith('data:application/pdf') && (
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
                    <button
                      onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-slate-300">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(Math.min(3, zoomScale + 0.25))}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Print/Download/Delete */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerDownload(activeReport)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={() => triggerPrint(activeReport)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  {!isReceptionist && (
                    <button
                      onClick={() => handleDeleteReport(activeReport._id)}
                      className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow hover:scale-105 transition"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
