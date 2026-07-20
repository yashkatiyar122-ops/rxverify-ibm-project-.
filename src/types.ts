export interface VisualAnalysis {
  color: string;
  shape: string;
  imprint: string;
  confidenceScore: number;
}

export interface Pharmacology {
  mechanismOfAction: string;
  therapeuticClass: string;
  indications: string[];
}

export interface SafetyScanner {
  commonSideEffects: string[];
  severeSideEffects: string[];
  contraindications: string[];
  pregnancyCategory: string;
  foodInteractions: string;
}

export interface DrugInteraction {
  medication: string;
  severity: string; // High, Moderate, Minor
  description: string;
}

export interface SuggestedAlternative {
  name: string;
  reason: string;
}

export interface RecognizedMedicine {
  brandName: string;
  genericName: string;
  strength: string;
  form: string;
  manufacturer: string;
  visualAnalysis: VisualAnalysis;
  pharmacology: Pharmacology;
  safetyScanner: SafetyScanner;
  drugInteractions: DrugInteraction[];
  suggestedAlternatives: SuggestedAlternative[];
}

export interface DecodedPrescription {
  patientName: string;
  rxNumber: string;
  medicationName: string;
  instructions: string;
  frequency: string;
  dosage: string;
  refills: string;
  expiryDate: string;
  doctorName: string;
  pharmacyDetails: string;
}

export interface CabinetItem {
  id: string;
  timestamp: string;
  imageUrl: string;
  mode: "identify" | "prescription";
  identifyResult?: RecognizedMedicine;
  prescriptionResult?: DecodedPrescription;
  category: "Prescription" | "OTC" | "Supplement" | "Unclassified";
  notes?: string;
  isFavorite: boolean;
}

export interface IntakeTime {
  id: string;
  time: string; // "HH:MM" 24h
  label: "Morning" | "Noon" | "Evening" | "Night" | "As Needed";
}

export interface MedicineSchedule {
  id: string; // links to CabinetItem id or custom item
  medicationName: string;
  strength: string;
  form: string;
  dosage: string; // e.g. "1 pill"
  frequency: string; // "daily", "twice-daily", "weekly", "as-needed"
  times: IntakeTime[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface IntakeLog {
  id: string;
  scheduleId: string;
  medicationName: string;
  timeSlotId: string; // ID of the IntakeTime
  timeSlotLabel: string;
  scheduledTime: string;
  takenTime: string;
  status: "Taken" | "Skipped";
  date: string; // "YYYY-MM-DD"
}
