import React, { useState, useEffect } from "react";
import {
  Pill,
  BookOpen,
  History,
  Activity,
  Plus,
  Trash2,
  Bookmark,
  ShieldCheck,
  CalendarCheck,
  ShieldAlert,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Clock,
  Video,
  FileCheck,
  NotebookTabs
} from "lucide-react";
import CameraCapture from "./components/CameraCapture";
import MedicineDetail from "./components/MedicineDetail";
import PrescriptionReader from "./components/PrescriptionReader";
import MedicineCabinet from "./components/MedicineCabinet";
import IntakeScheduler from "./components/IntakeScheduler";
import { CabinetItem, RecognizedMedicine, DecodedPrescription, MedicineSchedule, IntakeLog } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"scan" | "cabinet" | "schedule" | "watchlist">("scan");

  // Core App Persistence States
  const [cabinetItems, setCabinetItems] = useState<CabinetItem[]>([]);
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [userMedications, setUserMedications] = useState<string[]>(["Ibuprofen", "Metformin"]);

  // Core Scanning & Analysis States
  const [scanMode, setScanMode] = useState<"identify" | "prescription">("identify");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Results States
  const [scanResult, setScanResult] = useState<RecognizedMedicine | null>(null);
  const [decodedRxResult, setDecodedRxResult] = useState<DecodedPrescription | null>(null);
  const [currentScannedImage, setCurrentScannedImage] = useState<string | null>(null);

  // Scheduling integration state
  const [schedulerMedicine, setSchedulerMedicine] = useState<CabinetItem | null>(null);

  // New watchlist custom medicine adding state
  const [newMedName, setNewMedName] = useState<string>("");

  // Load from LocalStorage
  useEffect(() => {
    const cachedCabinet = localStorage.getItem("med_cabinet_items");
    const cachedSchedules = localStorage.getItem("med_schedules");
    const cachedLogs = localStorage.getItem("med_logs");
    const cachedWatchlist = localStorage.getItem("med_watchlist");

    if (cachedCabinet) setCabinetItems(JSON.parse(cachedCabinet));
    if (cachedSchedules) setSchedules(JSON.parse(cachedSchedules));
    if (cachedLogs) setLogs(JSON.parse(cachedLogs));
    if (cachedWatchlist) setUserMedications(JSON.parse(cachedWatchlist));
  }, []);

  // Save to LocalStorage helpers
  const saveCabinet = (items: CabinetItem[]) => {
    setCabinetItems(items);
    localStorage.setItem("med_cabinet_items", JSON.stringify(items));
  };

  const saveSchedules = (schs: MedicineSchedule[]) => {
    setSchedules(schs);
    localStorage.setItem("med_schedules", JSON.stringify(schs));
  };

  const saveLogs = (lgList: IntakeLog[]) => {
    setLogs(lgList);
    localStorage.setItem("med_logs", JSON.stringify(lgList));
  };

  const saveWatchlist = (meds: string[]) => {
    setUserMedications(meds);
    localStorage.setItem("med_watchlist", JSON.stringify(meds));
  };

  // Run automatic multi-modal analysis via backend API
  const handleAnalyzeImage = async (base64Image: string) => {
    setIsLoading(true);
    setError(null);
    setScanResult(null);
    setDecodedRxResult(null);
    setCurrentScannedImage(base64Image);

    // Dynamic feedback steps during loading
    const steps = [
      "Acquiring high-resolution image stream...",
      "Analyzing pill imprints, shapes, and color structures...",
      "Conducting clinical generic database matching...",
      "Executing drug-drug compatibility warning scanner...",
      "Compiling final pharmacological safety sheet..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/recognize-medicine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          mode: scanMode,
          userMedications,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || errData.error || "Failed to identify medicine");
      }

      const data = await response.json();
      const result = data.result;

      if (scanMode === "identify") {
        setScanResult(result);
      } else {
        setDecodedRxResult(result);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || "An unexpected network or model error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save current scanned result to cabinet
  const saveCurrentToCabinet = (category: "Prescription" | "OTC" | "Supplement" | "Unclassified") => {
    if (!currentScannedImage) return;

    const newItem: CabinetItem = {
      id: `cab-${Date.now()}`,
      timestamp: new Date().toISOString(),
      imageUrl: currentScannedImage,
      mode: scanMode,
      category,
      isFavorite: false,
      identifyResult: scanResult || undefined,
      prescriptionResult: decodedRxResult || undefined,
    };

    const updated = [newItem, ...cabinetItems];
    saveCabinet(updated);
  };

  // Cabinet interaction callbacks
  const handleToggleFavorite = (id: string) => {
    const updated = cabinetItems.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    saveCabinet(updated);
  };

  const handleDeleteCabinetItem = (id: string) => {
    const updated = cabinetItems.filter((item) => item.id !== id);
    saveCabinet(updated);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = cabinetItems.map((item) =>
      item.id === id ? { ...item, notes } : item
    );
    saveCabinet(updated);
  };

  const handleSelectFromCabinet = (item: CabinetItem) => {
    setScanMode(item.mode);
    setCurrentScannedImage(item.imageUrl);
    if (item.mode === "identify") {
      setScanResult(item.identifyResult || null);
      setDecodedRxResult(null);
    } else {
      setDecodedRxResult(item.prescriptionResult || null);
      setScanResult(null);
    }
    setActiveTab("scan");
  };

  // Scheduler integration callbacks
  const handleOpenSchedulerForCabinetItem = (item: CabinetItem) => {
    setSchedulerMedicine(item);
    setActiveTab("schedule");
  };

  const handleAddSchedule = (sch: MedicineSchedule) => {
    const updated = [sch, ...schedules];
    saveSchedules(updated);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    saveSchedules(updated);
  };

  const handleLogIntake = (log: IntakeLog) => {
    const updated = [...logs, log];
    saveLogs(updated);
  };

  // Add Custom Medication to Current Compatibility Watchlist
  const handleAddToWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;
    if (userMedications.map(m => m.toLowerCase()).includes(newMedName.trim().toLowerCase())) {
      alert("Medication already in your checklist.");
      return;
    }
    const updated = [...userMedications, newMedName.trim()];
    saveWatchlist(updated);
    setNewMedName("");
  };

  const handleRemoveFromWatchlist = (medName: string) => {
    const updated = userMedications.filter((m) => m !== medName);
    saveWatchlist(updated);
  };

  // Quick reset of scan interface
  const handleResetScan = () => {
    setScanResult(null);
    setDecodedRxResult(null);
    setCurrentScannedImage(null);
    setError(null);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      {/* Universal Medical Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Pill className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-800 tracking-tight block leading-none">
                RxVerify AI
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                Medicine Recognition & Safety Hub
              </span>
            </div>
          </div>

          {/* Nav Controls */}
          <nav className="flex items-center gap-6 h-16">
            <button
              onClick={() => setActiveTab("scan")}
              className={`h-full px-1 py-4 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "scan"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Scan Medication
            </button>
            <button
              onClick={() => setActiveTab("cabinet")}
              className={`h-full px-1 py-4 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "cabinet"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              <NotebookTabs className="w-3.5 h-3.5" />
              Cabinet
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`h-full px-1 py-4 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "schedule"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Scheduler
            </button>
            <button
              onClick={() => setActiveTab("watchlist")}
              className={`h-full px-1 py-4 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
                activeTab === "watchlist"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              My Meds List
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "scan" && (
            <motion.div
              key="scan-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Recent Identifications */}
              <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Recent Scans
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {cabinetItems.length > 0 ? (
                    cabinetItems.slice(0, 5).map((item) => {
                      const itemTitle = item.mode === "identify" ? item.identifyResult?.brandName : item.prescriptionResult?.medicationName;
                      const itemClass = item.mode === "identify" ? item.identifyResult?.pharmacology.therapeuticClass : "Prescription Label";
                      const firstLetter = itemTitle ? itemTitle[0] : "M";
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectFromCabinet(item)}
                          className="p-3 hover:bg-slate-50 transition-all flex gap-3 cursor-pointer items-center group"
                        >
                          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                            ) : (
                              firstLetter
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {itemTitle}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {itemClass}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <Pill className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                      <p className="text-xs font-medium">No recent scans</p>
                      <p className="text-[10px] mt-0.5">Your scan history appears here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Central Column: Scanning Control & Camera */}
              <div className="lg:col-span-5 space-y-6">
                {/* Scan Mode Toggle Controls */}
                {!currentScannedImage && !isLoading && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Select Recognition Mode</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Choose standard capsule scan or prescription label translation</p>
                    </div>

                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 self-stretch">
                      <button
                        onClick={() => setScanMode("identify")}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          scanMode === "identify" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Pill className="w-3.5 h-3.5 inline mr-1 align-text-bottom" />
                        Pill / Packet
                      </button>
                      <button
                        onClick={() => setScanMode("prescription")}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          scanMode === "prescription" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5 inline mr-1 align-text-bottom" />
                        Label Reader
                      </button>
                    </div>
                  </div>
                )}

                {/* Watchlist Quick-Status Banner */}
                {!currentScannedImage && !isLoading && userMedications.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-blue-900">Interactions Filter Active</p>
                        <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                          Checking compatibility against: <span className="font-bold">{userMedications.join(", ")}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Scanner Canvas */}
                {!currentScannedImage && !isLoading && (
                  <CameraCapture onImageCaptured={handleAnalyzeImage} isLoading={isLoading} />
                )}

                {/* Dynamic Progress Loader Panel */}
                {isLoading && (
                  <div id="loader-panel" className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-5">
                    <div className="relative w-14 h-14 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Analyzing Medical Product</h3>
                      <p className="text-[11px] text-slate-400 mt-1">Please keep the window open</p>
                    </div>
                    <div className="text-xs font-semibold text-blue-600 bg-blue-50 py-2 px-3.5 rounded-xl border border-blue-100/40 inline-block font-mono">
                      {loadingStep}
                    </div>
                  </div>
                )}

                {/* Error Alert Box */}
                {error && (
                  <div id="error-view" className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                    <div className="w-11 h-11 bg-rose-50 text-rose-500 border border-rose-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Analysis Unsuccessful</h3>
                      <p className="text-xs text-slate-400 mt-1">Please try again with a clearer image.</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-rose-800 font-mono text-left max-h-32 overflow-y-auto">
                      {error}
                    </div>
                    <button
                      onClick={handleResetScan}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Restart Scan
                    </button>
                  </div>
                )}

                {/* Mobile/Fallback Details presentation (rendered if screen is small) */}
                <div className="lg:hidden">
                  {scanResult && currentScannedImage && !isLoading && (
                    <div className="space-y-4">
                      <button
                        onClick={handleResetScan}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
                      >
                        ← Start New Scan
                      </button>
                      <MedicineDetail
                        medicine={scanResult}
                        onSaveToCabinet={saveCurrentToCabinet}
                        onOpenScheduler={() => {
                          const mockedCabinet: CabinetItem = {
                            id: `cab-temp`,
                            timestamp: new Date().toISOString(),
                            imageUrl: currentScannedImage,
                            mode: "identify",
                            category: "OTC",
                            isFavorite: false,
                            identifyResult: scanResult,
                          };
                          handleOpenSchedulerForCabinetItem(mockedCabinet);
                        }}
                        isSaved={cabinetItems.some((item) => item.imageUrl === currentScannedImage)}
                        userMedications={userMedications}
                      />
                    </div>
                  )}

                  {decodedRxResult && currentScannedImage && !isLoading && (
                    <div className="space-y-4">
                      <button
                        onClick={handleResetScan}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
                      >
                        ← Start New Scan
                      </button>
                      <PrescriptionReader
                        prescription={decodedRxResult}
                        onSaveToCabinet={() => saveCurrentToCabinet("Prescription")}
                        isSaved={cabinetItems.some((item) => item.imageUrl === currentScannedImage)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Information Panel or Scanned Result details */}
              <div className="lg:col-span-4 space-y-6">
                {scanResult || decodedRxResult ? (
                  <div className="hidden lg:block space-y-4">
                    <button
                      onClick={handleResetScan}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
                    >
                      ← Start New Scan
                    </button>
                    {scanResult && currentScannedImage && !isLoading && (
                      <MedicineDetail
                        medicine={scanResult}
                        onSaveToCabinet={saveCurrentToCabinet}
                        onOpenScheduler={() => {
                          const mockedCabinet: CabinetItem = {
                            id: `cab-temp`,
                            timestamp: new Date().toISOString(),
                            imageUrl: currentScannedImage,
                            mode: "identify",
                            category: "OTC",
                            isFavorite: false,
                            identifyResult: scanResult,
                          };
                          handleOpenSchedulerForCabinetItem(mockedCabinet);
                        }}
                        isSaved={cabinetItems.some((item) => item.imageUrl === currentScannedImage)}
                        userMedications={userMedications}
                      />
                    )}
                    {decodedRxResult && currentScannedImage && !isLoading && (
                      <PrescriptionReader
                        prescription={decodedRxResult}
                        onSaveToCabinet={() => saveCurrentToCabinet("Prescription")}
                        isSaved={cabinetItems.some((item) => item.imageUrl === currentScannedImage)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Verified Clinical Engine
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">v4.2.1-stable</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 leading-tight mb-2">
                      Scan your Medication
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-500 mb-6">
                      Capture an image of a pill, medicine box imprint, or prescription label to trigger high-fidelity recognition, automatic safety scanner and interactive scheduler.
                    </p>

                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Step 1
                        </p>
                        <p className="text-xs font-bold text-slate-700">Choose Mode</p>
                        <p className="text-xs text-slate-500 mt-0.5">Toggle between pill/imprint recognition or pharmacy label reader.</p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Step 2
                        </p>
                        <p className="text-xs font-bold text-slate-700">Capture or Upload</p>
                        <p className="text-xs text-slate-500 mt-0.5">Take a photo using your web camera, or drop an image file directly.</p>
                      </div>

                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                          Step 3
                        </p>
                        <p className="text-xs font-bold text-slate-700">Clinical Verification</p>
                        <p className="text-xs text-slate-500 mt-0.5">Review interactions, dosage, side effects, and add to scheduler alarm.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Cabinet View */}
          {activeTab === "cabinet" && (
            <motion.div
              key="cabinet-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <MedicineCabinet
                items={cabinetItems}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteCabinetItem}
                onUpdateNotes={handleUpdateNotes}
                onSelectMedicine={handleSelectFromCabinet}
                onOpenSchedulerForCabinetItem={handleOpenSchedulerForCabinetItem}
              />
            </motion.div>
          )}

          {/* Scheduler View */}
          {activeTab === "schedule" && (
            <motion.div
              key="schedule-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <IntakeScheduler
                schedules={schedules}
                cabinetItems={cabinetItems}
                logs={logs}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onLogIntake={handleLogIntake}
                preselectedMedicine={schedulerMedicine}
              />
            </motion.div>
          )}

          {/* Compatibility Watchlist Settings */}
          {activeTab === "watchlist" && (
            <motion.div
              key="watchlist-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
                  Interaction Watchlist Management
                </h2>
                <p className="text-xs text-slate-400">
                  Keep an updated record of medications you or your family members take daily. Whenever you capture or scan a new medication, our AI system checks this list for high-risk chemical compatibility warnings.
                </p>

                {/* Checklist adder */}
                <form onSubmit={handleAddToWatchlist} className="mt-5 flex gap-2">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Enter brand or generic drug name (e.g. Lisinopril)..."
                    className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white text-xs px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Drug
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 mb-4">
                  Medications Active in Interactions Filter
                </h3>

                {userMedications.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {userMedications.map((med) => (
                      <div
                        key={med}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Pill className="w-3.5 h-3.5 text-blue-600" />
                          {med}
                        </span>
                        <button
                          onClick={() => handleRemoveFromWatchlist(med)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-400 font-medium">Your checklist is empty.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Scanned pills will not execute mutual checks.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
