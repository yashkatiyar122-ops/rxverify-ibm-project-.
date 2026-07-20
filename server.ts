import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialization helper for Gemini SDK to grab the most up-to-date environment key
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured or is set to a placeholder. Please set a valid Gemini API key in your Secrets configuration or .env file."
    );
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Middleware to log API requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API endpoint for health check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Mode 'identify' response schema
const identifyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    brandName: { type: Type.STRING, description: "Brand name of the medication or product" },
    genericName: { type: Type.STRING, description: "Generic chemical names of the active ingredients" },
    strength: { type: Type.STRING, description: "Dosage strength, e.g. 500mg, 10mg/5ml" },
    form: { type: Type.STRING, description: "Physical form: Tablet, Capsule, Syrup, Ointment, Inhaler, Injection, etc." },
    manufacturer: { type: Type.STRING, description: "Pharmaceutical manufacturer of the product, if visible" },
    visualAnalysis: {
      type: Type.OBJECT,
      properties: {
        color: { type: Type.STRING, description: "Color or colors of the pill, bottle, or packaging" },
        shape: { type: Type.STRING, description: "Physical shape, e.g. Round, Oval, Oblong, Liquid in bottle, Tube" },
        imprint: { type: Type.STRING, description: "Any letters, numbers, logos, or markings printed on the pill or bottle" },
        confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
      },
      required: ["color", "shape", "imprint", "confidenceScore"],
    },
    pharmacology: {
      type: Type.OBJECT,
      properties: {
        mechanismOfAction: { type: Type.STRING, description: "Brief description of how this drug works in the body" },
        therapeuticClass: { type: Type.STRING, description: "The drug class, e.g. Analgesic, NSAID, Antihypertensive" },
        indications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Primary symptoms or conditions treated" },
      },
      required: ["mechanismOfAction", "therapeuticClass", "indications"],
    },
    safetyScanner: {
      type: Type.OBJECT,
      properties: {
        commonSideEffects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Most common, non-severe side effects" },
        severeSideEffects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Side effects requiring immediate medical attention" },
        contraindications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Conditions/scenarios where this medicine should NOT be taken" },
        pregnancyCategory: { type: Type.STRING, description: "FDA Pregnancy safety category (A, B, C, D, X, or N/A)" },
        foodInteractions: { type: Type.STRING, description: "Notable interactions with food, alcohol, or caffeine" },
      },
      required: ["commonSideEffects", "severeSideEffects", "contraindications", "pregnancyCategory", "foodInteractions"],
    },
    drugInteractions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          medication: { type: Type.STRING, description: "Name of the interacting drug from user's taken list" },
          severity: { type: Type.STRING, description: "High, Moderate, or Minor warning level" },
          description: { type: Type.STRING, description: "Explanation of why they interact and what can happen" },
        },
        required: ["medication", "severity", "description"],
      },
      description: "Any matches/conflicts with the provided userMedications taken list",
    },
    suggestedAlternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the alternative generic or similar active medicine" },
          reason: { type: Type.STRING, description: "Reason why it is a suitable alternative (e.g. same therapeutic class)" },
        },
        required: ["name", "reason"],
      },
      description: "Generic alternatives or similar substitutes",
    },
  },
  required: [
    "brandName",
    "genericName",
    "strength",
    "form",
    "manufacturer",
    "visualAnalysis",
    "pharmacology",
    "safetyScanner",
    "drugInteractions",
    "suggestedAlternatives",
  ],
};

// Mode 'prescription' response schema
const prescriptionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    patientName: { type: Type.STRING, description: "Patient's name decoded from label, or 'Unknown' if not visible" },
    rxNumber: { type: Type.STRING, description: "Prescription number (Rx#) if available, or 'N/A'" },
    medicationName: { type: Type.STRING, description: "Name of the medication specified in the prescription" },
    instructions: { type: Type.STRING, description: "Decoded instructions (Sig) for the patient, e.g. Take 1 tablet by mouth daily" },
    frequency: { type: Type.STRING, description: "Dosage frequency, e.g. Daily, Twice daily, Every 6 hours" },
    dosage: { type: Type.STRING, description: "Dosage quantity, e.g. 1 Tablet, 5ml" },
    refills: { type: Type.STRING, description: "Refill details, e.g. '3 refills remaining', '0'" },
    expiryDate: { type: Type.STRING, description: "Expiry or discard-by date mentioned on the label" },
    doctorName: { type: Type.STRING, description: "Prescribing physician's name, or 'Unknown'" },
    pharmacyDetails: { type: Type.STRING, description: "Pharmacy name and phone number if visible, or 'Unknown'" },
  },
  required: [
    "patientName",
    "rxNumber",
    "medicationName",
    "instructions",
    "frequency",
    "dosage",
    "refills",
    "expiryDate",
    "doctorName",
    "pharmacyDetails",
  ],
};

// Main multi-modal recognition endpoint
app.post("/api/recognize-medicine", async (req, res) => {
  try {
    const { image, mode = "identify", userMedications = [] } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    // Extract base64 details
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    let prompt = "";
    let schemaToUse: any = identifyResponseSchema;

    if (mode === "prescription") {
      prompt = `
        You are an advanced clinical pharmacist and OCR system designed to read and decode prescription papers, doctor-written scripts, or pharmacy labels on medication containers.
        Analyze the attached image and extract all relevant prescription information.
        Be highly precise. If any detail is blurry or missing, write 'Unknown' or 'N/A' as appropriate.
      `;
      schemaToUse = prescriptionResponseSchema;
    } else {
      const medicationsStr = userMedications.length > 0 ? userMedications.join(", ") : "none";
      prompt = `
        You are an expert pharmaceutical recognition system. Analyze the attached image containing a medication pill (tablet/capsule), medication strip, bottle label, or syrup bottle.
        
        1. Identify the medicine (Brand Name, Generic Name, strength, form, manufacturer).
        2. Perform a careful physical visual analysis of the object (color, shape, any visible imprint, markings, or details).
        3. Provide the drug's core pharmacology: mechanism of action, therapeutic class, and primary medical indications.
        4. Populate a comprehensive safety scan: common side effects, severe warning side effects, contraindications, pregnancy safety rating, and dietary/food precautions.
        5. CRITICAL: Analyze potential drug-drug interactions with this identified medication and the following list of medications the patient currently takes: [${medicationsStr}]. If any of these medications has a known clinical interaction with the recognized drug, populate the "drugInteractions" array with high, moderate, or minor severity, describing the physiological reaction and risks.
        6. Offer safe generic alternatives or similar pharmacological substitutes.

        Analyze strictly based on clinical guidelines. Put safety first. Include a clear confidence score for the recognition.
      `;
      schemaToUse = identifyResponseSchema;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [imagePart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schemaToUse,
        temperature: 0.2, // Low temperature for high precision/factual response
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini API");
    }

    const parsedResult = JSON.parse(text.trim());
    return res.json({ result: parsedResult });

  } catch (error: any) {
    console.error("Gemini Recognition Error:", error);
    return res.status(500).json({
      error: "Failed to process medicine image",
      details: error.message || "An unexpected server-side error occurred",
    });
  }
});

// Setup Vite development middleware or serve production static assets
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Medicine Recognition System is live on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start fullstack server:", err);
});
