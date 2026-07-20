import React from "react";
import { DecodedPrescription } from "../types";
import { FileText, User, Calendar, Activity, ClipboardList, Bookmark, CalendarClock, PhoneCall, ShieldAlert, Check } from "lucide-react";

interface PrescriptionReaderProps {
  prescription: DecodedPrescription;
  onSaveToCabinet: () => void;
  isSaved: boolean;
}

export default function PrescriptionReader({
  prescription,
  onSaveToCabinet,
  isSaved
}: PrescriptionReaderProps) {
  const {
    patientName,
    rxNumber,
    medicationName,
    instructions,
    frequency,
    dosage,
    refills,
    expiryDate,
    doctorName,
    pharmacyDetails
  } = prescription;

  return (
    <div id="prescription-reader-view" className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/25 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 id="rx-label-title" className="text-xl md:text-2xl font-extrabold tracking-tight">
                Decoded Pharmacy Label
              </h1>
              <p className="text-slate-300 text-xs mt-0.5">
                Rx Number: {rxNumber || "N/A"} • Expiry: {expiryDate || "N/A"}
              </p>
            </div>
          </div>

          {!isSaved ? (
            <button
              id="save-rx-btn"
              onClick={onSaveToCabinet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              Save Rx to Cabinet
            </button>
          ) : (
            <span className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Saved to Cabinet
            </span>
          )}
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">CAUTION:</span> Decoded instructions are generated using AI character-recognition algorithms. Verify that these match the physical paper or container labeling before consuming. Refills or dosage values should always be cross-referenced with your pharmacy logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Profile & Doc info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Clinical Metadata
          </h3>
          
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient Registered</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{patientName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ClipboardList className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prescribing Doctor</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{doctorName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refills Details</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{refills}</p>
            </div>
          </div>
        </div>

        {/* Medication Intake Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2 space-y-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            Active Prescription & SIG Directions
          </h3>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Prescribed Medicine</p>
            <p className="text-lg font-extrabold text-slate-800 mt-0.5">
              {medicationName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Unit Dosage</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{dosage}</p>
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Frequency Interval</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{frequency}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Patient Instructions (SIG Code Decoded)
            </span>
            <p className="text-base font-medium text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-xl italic">
              "{instructions}"
            </p>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      {pharmacyDetails && pharmacyDetails !== "Unknown" && (
        <div id="pharmacy-details-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Decoded Pharmacy Context</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{pharmacyDetails}</p>
            </div>
          </div>
          <a
            href={`tel:${pharmacyDetails.replace(/[^0-9]/g, "")}`}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all"
          >
            Call Pharmacy
          </a>
        </div>
      )}
    </div>
  );
}
