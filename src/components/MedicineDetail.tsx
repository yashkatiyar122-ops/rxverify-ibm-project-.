import React, { useState } from "react";
import {
  Pill,
  ShieldCheck,
  ShieldAlert,
  Layers,
  HeartPulse,
  Scale,
  ListRestart,
  Plus,
  ArrowRight,
  Info,
  BadgeAlert,
  Bookmark,
  CalendarDays,
  FileCheck
} from "lucide-react";
import { RecognizedMedicine } from "../types";
import { motion } from "motion/react";

interface MedicineDetailProps {
  medicine: RecognizedMedicine;
  onSaveToCabinet: (category: "Prescription" | "OTC" | "Supplement") => void;
  onOpenScheduler: () => void;
  isSaved: boolean;
  userMedications: string[];
}

export default function MedicineDetail({
  medicine,
  onSaveToCabinet,
  onOpenScheduler,
  isSaved,
  userMedications
}: MedicineDetailProps) {
  const [selectedCategory, setSelectedCategory] = useState<"Prescription" | "OTC" | "Supplement">("OTC");
  const [notes, setNotes] = useState<string>("");

  const {
    brandName,
    genericName,
    strength,
    form,
    manufacturer,
    visualAnalysis,
    pharmacology,
    safetyScanner,
    drugInteractions,
    suggestedAlternatives,
  } = medicine;

  return (
    <div id="medicine-detail-view" className="space-y-6">
      {/* Clinician's Verification Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-0 -translate-x-12 translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 id="medicine-title" className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {brandName}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  AI Conf: {(visualAnalysis.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-300 text-sm md:text-base font-medium mt-1">
                {genericName} • {strength} • {form}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Manufacturer: {manufacturer || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {!isSaved ? (
              <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-200 outline-none px-2 py-1 select-none cursor-pointer"
                >
                  <option value="OTC" className="bg-slate-800">OTC (Over Counter)</option>
                  <option value="Prescription" className="bg-slate-800">Prescription</option>
                  <option value="Supplement" className="bg-slate-800">Supplement</option>
                </select>
                <button
                  id="save-to-cabinet-btn"
                  onClick={() => onSaveToCabinet(selectedCategory)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  Save to Cabinet
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 justify-center w-full md:w-auto">
                <ShieldCheck className="w-4 h-4" />
                Saved in Medicine Cabinet
              </div>
            )}

            <button
              id="schedule-intake-btn"
              onClick={onOpenScheduler}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer justify-center w-full md:w-auto"
            >
              <CalendarDays className="w-4 h-4" />
              Schedule Intake
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Clinical Disclaimer */}
      <div id="disclaimer-alert" className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <BadgeAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">MEDICAL DISCLAIMER:</span> This chemical identification is generated using a multimodal machine learning model for educational and informational purposes. It is NOT a professional clinical consultation. Always verify with your doctor or licensed pharmacist before administering any medication. Do not disregard official medical instructions based on this scan.
        </div>
      </div>

      {/* Drug Interactions Checker Section */}
      {userMedications.length > 0 && (
        <div id="interactions-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            Automatic Drug-Drug Interactions
          </h2>
          {drugInteractions.length > 0 ? (
            <div className="grid gap-3">
              {drugInteractions.map((interaction, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex gap-3 ${
                    interaction.severity.toLowerCase() === "high"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : interaction.severity.toLowerCase() === "moderate"
                      ? "bg-amber-50 border-amber-200 text-amber-900"
                      : "bg-blue-50 border-blue-200 text-blue-900"
                  }`}
                >
                  <BadgeAlert
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      interaction.severity.toLowerCase() === "high"
                        ? "text-rose-600"
                        : interaction.severity.toLowerCase() === "moderate"
                        ? "text-amber-600"
                        : "text-blue-600"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {interaction.medication}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          interaction.severity.toLowerCase() === "high"
                            ? "bg-rose-200 text-rose-800"
                            : interaction.severity.toLowerCase() === "moderate"
                            ? "bg-amber-200 text-amber-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {interaction.severity} Warning
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {interaction.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-medium">
                No clinical drug-drug interactions detected between <span className="font-bold">{brandName}</span> and your current medicine list: <span className="font-semibold">{userMedications.join(", ")}</span>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Bento Grid layout */}
      <div id="bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Visual Blueprint */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Pill className="w-4.5 h-4.5 text-blue-600" />
              Visual Identification
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-400">Tablet Form</span>
                <span className="text-xs font-semibold text-slate-700">{form}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-400">Color Profile</span>
                <span className="text-xs font-semibold text-slate-700">{visualAnalysis.color}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-400">Physical Shape</span>
                <span className="text-xs font-semibold text-slate-700">{visualAnalysis.shape}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-400 shrink-0">Engravings/Markings</span>
                <span className="text-xs font-semibold text-slate-700 text-right max-w-40 break-words">
                  {visualAnalysis.imprint !== "Unknown" && visualAnalysis.imprint !== "N/A"
                    ? `"${visualAnalysis.imprint}"`
                    : "None identified"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Confidence values are based on raw image resolution.
          </div>
        </div>

        {/* Card 2: Core Pharmacology */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers className="w-4.5 h-4.5 text-blue-600" />
              Pharmacology & Indications
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Therapeutic Class
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {pharmacology.therapeuticClass}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Mechanism of Action
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pharmacology.mechanismOfAction}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Approved Indications
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {pharmacology.indications.map((ind, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Clinical Safety Precautions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <HeartPulse className="w-4.5 h-4.5 text-rose-500" />
              Safety & Precautions
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-medium text-slate-400">Pregnancy Rating</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded">
                  Category {safetyScanner.pregnancyCategory}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Contraindications</span>
                <div className="flex flex-wrap gap-1">
                  {safetyScanner.contraindications.slice(0, 3).map((contra, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded"
                    >
                      {contra}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Dietary Restrictions</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {safetyScanner.foodInteractions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Side Effects Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Scale className="w-4.5 h-4.5 text-amber-500" />
            Side Effects Profile
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2">Common Side Effects</span>
              <ul className="grid grid-cols-2 gap-2">
                {safetyScanner.commonSideEffects.map((side, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                    <span>{side}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-xs font-bold text-rose-600 block mb-2">Severe Alerts (Contact Doctor)</span>
              <ul className="space-y-2">
                {safetyScanner.severeSideEffects.map((side, i) => (
                  <li key={i} className="text-xs text-rose-800 bg-rose-50/50 p-2 rounded-lg border border-rose-100/30 flex items-start gap-2">
                    <BadgeAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{side}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Card 5: Suggested Substitutes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm md:col-span-2 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <ListRestart className="w-4.5 h-4.5 text-blue-600" />
            Generic Alternatives & Equivalents
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Below are equivalent pharmacological substances or active generic ingredients that share similar chemical structures or therapeutic purposes:
          </p>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {suggestedAlternatives.length > 0 ? (
              suggestedAlternatives.map((alt, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      {alt.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {alt.reason}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No equivalent products mapped for this clinical class.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
