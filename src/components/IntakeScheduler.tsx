import React, { useState } from "react";
import { MedicineSchedule, CabinetItem, IntakeTime, IntakeLog } from "../types";
import { Plus, Check, CalendarDays, AlarmClock, Calendar, Sparkles, Trash2, X, Play, RefreshCw, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface IntakeSchedulerProps {
  schedules: MedicineSchedule[];
  cabinetItems: CabinetItem[];
  logs: IntakeLog[];
  onAddSchedule: (schedule: MedicineSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onLogIntake: (log: IntakeLog) => void;
  onCloseScheduler?: () => void;
  preselectedMedicine?: CabinetItem | null;
}

export default function IntakeScheduler({
  schedules,
  cabinetItems,
  logs,
  onAddSchedule,
  onDeleteSchedule,
  onLogIntake,
  onCloseScheduler,
  preselectedMedicine
}: IntakeSchedulerProps) {
  // New Schedule form states
  const [medicationId, setMedicationId] = useState<string>(preselectedMedicine?.id || "");
  const [customName, setCustomName] = useState<string>(preselectedMedicine ? (preselectedMedicine.mode === "identify" ? preselectedMedicine.identifyResult?.brandName || "" : preselectedMedicine.prescriptionResult?.medicationName || "") : "");
  const [dosage, setDosage] = useState<string>("1 pill");
  const [frequency, setFrequency] = useState<string>("daily");
  const [times, setTimes] = useState<IntakeTime[]>([
    { id: "t1", time: "08:00", label: "Morning" }
  ]);
  const [selectedLabel, setSelectedLabel] = useState<"Morning" | "Noon" | "Evening" | "Night" | "As Needed">("Morning");
  const [timeInput, setTimeInput] = useState<string>("08:00");

  const [activeTab, setActiveTab] = useState<"today" | "schedules" | "logs">("today");

  // Get current date string
  const todayStr = new Date().toISOString().split("T")[0];

  // Map of active schedules today
  const schedulesToday = schedules.filter(s => s.isActive);

  // Calculate compliance statistics
  const totalLogs = logs.length;
  const takenLogs = logs.filter(l => l.status === "Taken").length;
  const complianceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  // Handle adding times slots to form
  const handleAddTime = () => {
    const newId = `t-${Date.now()}`;
    setTimes([...times, { id: newId, time: timeInput, label: selectedLabel }]);
  };

  const handleRemoveTime = (id: string) => {
    setTimes(times.filter(t => t.id !== id));
  };

  // Submit Schedule
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = customName;
    let finalStrength = "";
    let finalForm = "Tablet";

    if (medicationId) {
      const selectedItem = cabinetItems.find(item => item.id === medicationId);
      if (selectedItem) {
        if (selectedItem.mode === "identify" && selectedItem.identifyResult) {
          finalName = selectedItem.identifyResult.brandName;
          finalStrength = selectedItem.identifyResult.strength;
          finalForm = selectedItem.identifyResult.form;
        } else if (selectedItem.mode === "prescription" && selectedItem.prescriptionResult) {
          finalName = selectedItem.prescriptionResult.medicationName;
          finalStrength = selectedItem.prescriptionResult.dosage;
          finalForm = "Prescription";
        }
      }
    }

    if (!finalName) {
      alert("Please enter or select a medication name");
      return;
    }

    const newSchedule: MedicineSchedule = {
      id: `sch-${Date.now()}`,
      medicationName: finalName,
      strength: finalStrength,
      form: finalForm,
      dosage,
      frequency,
      times,
      startDate: todayStr,
      isActive: true,
    };

    onAddSchedule(newSchedule);
    // Reset form
    setCustomName("");
    setMedicationId("");
    setTimes([{ id: "t1", time: "08:00", label: "Morning" }]);
    setActiveTab("schedules");
  };

  // Log intake dose
  const logIntakeDose = (schedule: MedicineSchedule, timeSlot: IntakeTime, status: "Taken" | "Skipped") => {
    const newLog: IntakeLog = {
      id: `log-${Date.now()}`,
      scheduleId: schedule.id,
      medicationName: schedule.medicationName,
      timeSlotId: timeSlot.id,
      timeSlotLabel: timeSlot.label,
      scheduledTime: timeSlot.time,
      takenTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      status,
      date: todayStr
    };
    onLogIntake(newLog);
  };

  return (
    <div id="intake-scheduler-root" className="space-y-6">
      {/* Scheduler Dashboard Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div>
          <h2 id="scheduler-header" className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5.5 h-5.5 text-blue-600" />
            Intake Scheduler & Dose Reminders
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Build your personalized clinical schedule and document intake status.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("today")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "today" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Today's Plan
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "schedules" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active Schedules
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "logs" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Compliance Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tab 1: Today's Intake Plan */}
        {activeTab === "today" && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Calendar className="w-4.5 h-4.5 text-blue-600" />
                Dose Agenda for Today • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>

              {schedulesToday.length > 0 ? (
                <div className="space-y-4">
                  {schedulesToday.map((schedule) => (
                    <div key={schedule.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between border-b border-slate-200/55 pb-2 mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {schedule.medicationName} {schedule.strength ? `(${schedule.strength})` : ""}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Take {schedule.dosage} • {schedule.frequency}
                          </p>
                        </div>
                        <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-700 font-bold uppercase px-2 py-0.5 rounded">
                          {schedule.form}
                        </span>
                      </div>

                      {/* Schedule Time slots loggers */}
                      <div className="space-y-2.5">
                        {schedule.times.map((slot) => {
                          const isLogged = logs.find(
                            l => l.scheduleId === schedule.id && l.timeSlotId === slot.id && l.date === todayStr
                          );

                          return (
                            <div key={slot.id} className="flex items-center justify-between bg-white border border-slate-200/70 p-3 rounded-lg text-xs">
                              <div className="flex items-center gap-2.5">
                                <AlarmClock className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="font-bold text-slate-700">{slot.time}</span>
                                  <span className="text-slate-400 font-medium ml-2">({slot.label})</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isLogged ? (
                                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1.5 ${
                                    isLogged.status === "Taken"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}>
                                    <Check className="w-3 h-3" />
                                    {isLogged.status} at {isLogged.takenTime}
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => logIntakeDose(schedule, slot, "Taken")}
                                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold rounded-lg transition-all cursor-pointer"
                                    >
                                      Mark Taken
                                    </button>
                                    <button
                                      onClick={() => logIntakeDose(schedule, slot, "Skipped")}
                                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-medium rounded-lg transition-all cursor-pointer"
                                    >
                                      Skip
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No medication schedules scheduled for today</p>
                  <p className="text-xs text-slate-400 mt-1">Use the "Create Schedule" card to schedule automatic plans.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: All Active Schedules */}
        {activeTab === "schedules" && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <CalendarCheck className="w-4.5 h-4.5 text-blue-600" />
                Active Medication Schedules
              </h3>

              {schedules.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-sm">
                            {schedule.medicationName}
                          </h4>
                          <button
                            onClick={() => onDeleteSchedule(schedule.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Dosage: {schedule.dosage} • {schedule.frequency}
                        </p>
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Alarm Times:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {schedule.times.map((slot, idx) => (
                              <span key={idx} className="bg-white px-2 py-0.5 border border-slate-200/55 rounded-md text-[10px] text-slate-600 font-semibold">
                                {slot.time} ({slot.label})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-slate-700">No active medication schedules found</p>
                  <p className="text-xs text-slate-400 mt-1">Setup schedules to track daily compliance easily.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Compliance logs */}
        {activeTab === "logs" && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <CalendarCheck className="w-4.5 h-4.5 text-blue-600" />
                Historic Compliance Records
              </h3>

              {logs.length > 0 ? (
                <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2 animate-fadeIn">
                  {[...logs].reverse().map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{log.medicationName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Scheduled: {log.scheduledTime} ({log.timeSlotLabel}) • Logged at: {log.takenTime} • Date: {log.date}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        log.status === "Taken"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-slate-700">No historic dosage records captured</p>
                  <p className="text-xs text-slate-400 mt-1">Doses marked as Taken/Skipped on Today's Plan will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Panel: Create Schedule Form & Compliance Stats */}
        <div className="space-y-6">
          {/* Circular/SVG Compliance Meter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Clinical Compliance Stats</h4>
            
            <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  className="stroke-slate-100 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  className="stroke-blue-600 fill-transparent transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - complianceRate / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800">{complianceRate}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Taken</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs font-medium text-slate-400">Total Doses</p>
                <p className="text-base font-extrabold text-slate-700">{totalLogs}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-400">Adherence</p>
                <p className="text-base font-extrabold text-blue-600">Excellent</p>
              </div>
            </div>
          </div>

          {/* Create Schedule Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-4">
              <Plus className="w-4 h-4 text-blue-600" />
              Create Custom Schedule
            </h3>

            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Medication Selection</label>
                {cabinetItems.length > 0 ? (
                  <select
                    value={medicationId}
                    onChange={(e) => {
                      setMedicationId(e.target.value);
                      const sel = cabinetItems.find(i => i.id === e.target.value);
                      if (sel) {
                        setCustomName(sel.mode === "identify" ? sel.identifyResult?.brandName || "" : sel.prescriptionResult?.medicationName || "");
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Or enter custom name --</option>
                    {cabinetItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.mode === "identify" ? item.identifyResult?.brandName : item.prescriptionResult?.medicationName}
                      </option>
                    ))}
                  </select>
                ) : null}

                {!medicationId && (
                  <input
                    type="text"
                    placeholder="Enter medication name..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl mt-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dosage Units</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    required
                    placeholder="e.g. 1 pill, 5ml"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as-needed">As Needed</option>
                  </select>
                </div>
              </div>

              {/* Time Alarm builder */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Schedule Alarm Times</label>
                <div className="flex flex-wrap gap-1 mb-3">
                  {times.map((t) => (
                    <span key={t.id} className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      {t.time} ({t.label})
                      <button type="button" onClick={() => handleRemoveTime(t.id)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-1.5 items-center">
                  <select
                    value={selectedLabel}
                    onChange={(e: any) => setSelectedLabel(e.target.value)}
                    className="bg-white border border-slate-200 text-[10px] px-2 py-1 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Noon">Noon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="As Needed">PRN</option>
                  </select>
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="bg-white border border-slate-200 text-xs px-2 py-1 rounded-lg outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Launch Intake Schedule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
