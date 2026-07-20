import React, { useState } from "react";
import { CabinetItem } from "../types";
import { Search, Heart, Trash2, CalendarDays, ChevronDown, ChevronUp, Pill, FileText, Bookmark, Info, NotebookTabs } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MedicineCabinetProps {
  items: CabinetItem[];
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onSelectMedicine: (item: CabinetItem) => void;
  onOpenSchedulerForCabinetItem: (item: CabinetItem) => void;
}

export default function MedicineCabinet({
  items,
  onToggleFavorite,
  onDeleteItem,
  onUpdateNotes,
  onSelectMedicine,
  onOpenSchedulerForCabinetItem
}: MedicineCabinetProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");

  const categories = ["All", "Prescription", "OTC", "Supplement"];

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category check
    if (activeCategory !== "All" && item.category !== activeCategory) {
      return false;
    }

    // Search check
    const query = searchQuery.toLowerCase();
    if (item.mode === "identify" && item.identifyResult) {
      const { brandName, genericName, pharmacology } = item.identifyResult;
      return (
        brandName.toLowerCase().includes(query) ||
        genericName.toLowerCase().includes(query) ||
        pharmacology.therapeuticClass.toLowerCase().includes(query)
      );
    } else if (item.mode === "prescription" && item.prescriptionResult) {
      const { medicationName, patientName, doctorName } = item.prescriptionResult;
      return (
        medicationName.toLowerCase().includes(query) ||
        patientName.toLowerCase().includes(query) ||
        doctorName.toLowerCase().includes(query)
      );
    }
    return false;
  });

  const toggleExpand = (id: string) => {
    if (expandedItemId === id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(id);
    }
  };

  const startEditingNotes = (item: CabinetItem) => {
    setEditingNotesId(item.id);
    setNotesInput(item.notes || "");
  };

  const saveNotes = (id: string) => {
    onUpdateNotes(id, notesInput);
    setEditingNotesId(null);
  };

  return (
    <div id="medicine-cabinet-section" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 id="cabinet-title" className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <NotebookTabs className="w-5.5 h-5.5 text-blue-600" />
          My Medicine Cabinet
        </h2>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand, generic name, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none text-sm transition-all"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Catalog Lists */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const title = item.mode === "identify" ? item.identifyResult?.brandName : item.prescriptionResult?.medicationName;
              const subtitle = item.mode === "identify" ? item.identifyResult?.genericName : item.prescriptionResult?.instructions;
              const strength = item.mode === "identify" ? item.identifyResult?.strength : item.prescriptionResult?.dosage;
              const displayForm = item.mode === "identify" ? item.identifyResult?.form : item.prescriptionResult?.frequency;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      {item.imageUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                          item.mode === "identify"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                          {item.mode === "identify" ? <Pill className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base truncate max-w-64">
                            {title}
                          </h3>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.category === "Prescription"
                              ? "bg-blue-50 border border-blue-100 text-blue-700"
                              : item.category === "OTC"
                              ? "bg-slate-100 border border-slate-200 text-slate-700"
                              : "bg-violet-50 border border-violet-100 text-violet-700"
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {subtitle} {strength ? `• ${strength}` : ""} {displayForm ? `• ${displayForm}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Scanned on: {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 shrink-0">
                      <button
                        onClick={() => onToggleFavorite(item.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          item.isFavorite
                            ? "bg-rose-50 border-rose-100 text-rose-500"
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        }`}
                        title="Favorite"
                      >
                        <Heart className="w-4.5 h-4.5 fill-current" />
                      </button>

                      <button
                        onClick={() => onOpenSchedulerForCabinetItem(item)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer"
                        title="Schedule alarms"
                      >
                        <CalendarDays className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => onSelectMedicine(item)}
                        className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-all cursor-pointer"
                      >
                        Open Details
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
                        title="Delete from cabinet"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Notes and Clinical Highlights */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-200 bg-slate-50/50 pt-4 space-y-4">
                      {/* Interactive Cabinet Notes */}
                      <div>
                        <span className="text-xs font-bold text-slate-500 block mb-1.5">Personal Log / Notes</span>
                        {editingNotesId === item.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={notesInput}
                              onChange={(e) => setNotesInput(e.target.value)}
                              placeholder="Enter dose guidelines, expiry, or pharmacy details..."
                              className="flex-1 bg-white border border-slate-200 rounded-xl text-xs px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => saveNotes(item.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                            <span>{item.notes || "No notes logged. Tap 'Edit' to document dosages or medication dates."}</span>
                            <button
                              onClick={() => startEditingNotes(item)}
                              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Brief details overview */}
                      {item.mode === "identify" && item.identifyResult && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Therapeutic Indication</span>
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              {item.identifyResult.pharmacology.therapeuticClass}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                              {item.identifyResult.pharmacology.indications.join(", ")}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Common Side Effects</span>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              {item.identifyResult.safetyScanner.commonSideEffects.slice(0, 3).join(", ")}...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <motion.div
              layout
              className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Bookmark className="w-7 h-7" />
              </div>
              <p className="text-slate-600 font-semibold text-base">No matches found in your cabinet</p>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing your search filters or start by scanning a medicine.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
