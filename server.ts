import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { GoogleGenAI } from "@google/genai";
import {
  getOrCreateUser,
  getUserByUid,
  getConsultationById,
  getAllConsultations,
  getUserConsultations,
  createConsultation,
  updateConsultationStatus,
  updateConsultationNotes,
  updateConsultationDocuments,
  deleteConsultation,
  getAllReviews,
  createReview,
} from "./src/db/helpers.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User synchronization route
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "";
      if (!uid) {
        return res.status(400).json({ error: "Missing Firebase User ID (UID)" });
      }
      const user = await getOrCreateUser(uid, email);
      res.json({ user });
    } catch (error: any) {
      console.error("Error in sync auth:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await getAllReviews();
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new review
  app.post("/api/reviews", async (req, res) => {
    try {
      const { id, author, role, text, rating, date, uid } = req.body;
      if (!id || !author || !text || !rating || !date) {
        return res.status(400).json({ error: "Missing required review fields" });
      }

      let userId = null;
      if (uid) {
        const user = await getUserByUid(uid);
        if (user) userId = user.id;
      }

      const newReview = await createReview({
        id,
        author,
        role,
        text,
        rating,
        date,
        userId,
      });

      res.status(201).json(newReview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get consultations
  // Optional auth: if token provided, can filter by user. If not, returns all for admin access.
  app.get("/api/consultations", async (req, res) => {
    try {
      // Check if authorization is passed
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        try {
          const { adminAuth } = await import("./src/lib/firebase-admin.ts");
          const decodedToken = await adminAuth.verifyIdToken(token);
          const user = await getUserByUid(decodedToken.uid);
          if (user) {
            const list = await getUserConsultations(user.id);
            return res.json(list);
          }
        } catch (authErr) {
          // Fall back to returning all if token fails (or is invalid)
          console.warn("Invalid token passed, returning all consultations", authErr);
        }
      }

      const consultations = await getAllConsultations();
      res.json(consultations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new consultation request
  app.post("/api/consultations", async (req, res) => {
    try {
      const { id, name, phone, service, date, urgency, details, status, notes, timestamp, uid } = req.body;
      if (!id || !name || !phone || !service || !date || !urgency || !details || !status || !timestamp) {
        return res.status(400).json({ error: "Missing required consultation fields" });
      }

      let userId = null;
      if (uid) {
        const user = await getUserByUid(uid);
        if (user) userId = user.id;
      }

      const request = await createConsultation({
        id,
        name,
        phone,
        service,
        date,
        urgency,
        details,
        status,
        notes,
        timestamp,
        userId,
      });

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update status of consultation request
  app.put("/api/consultations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, changeNotes } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Missing status field" });
      }
      const updated = await updateConsultationStatus(id, status, changeNotes);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update notes of consultation request
  app.put("/api/consultations/:id/notes", async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      if (notes === undefined) {
        return res.status(400).json({ error: "Missing notes field" });
      }
      const updated = await updateConsultationNotes(id, notes);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update documents checklist of consultation request
  app.put("/api/consultations/:id/documents", async (req, res) => {
    try {
      const { id } = req.params;
      const { documents } = req.body;
      if (documents === undefined) {
        return res.status(400).json({ error: "Missing documents field" });
      }
      const updated = await updateConsultationDocuments(id, documents);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Process and transcribe recorded audio summarization notes via Gemini
  app.post("/api/consultations/:id/audio-note", async (req, res) => {
    try {
      const { id } = req.params;
      const { audioData, mimeType } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: "Missing audioData base64 payload" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      console.log(`Transcribing case note audio of type: ${mimeType || "audio/webm"} using Gemini...`);

      const prompt = `You are an elite legal secretary and court transcribing assistant.
Analyze this raw audio recording from an advocate summarizing legal case updates, docket progress, or consultation outcomes.
Transcribe the content extremely accurately. Fix spelling of specialized legal terms or names where obvious.
Write the final text in a highly professional, well-formatted structured legal case note summary.
Do not output any introductory or conversational text. Output ONLY the clean transcribed, polished legal note summary.
If the speaker is speaking a blend of English and Urdu (Hinglish/Urdu), transcribe or translate it into professional bilingual or clear English-translated text suitable for court docket files.`;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
              data: audioData,
            },
          },
          prompt,
        ],
      });

      const transcribedText = geminiRes.text || "No transcription received.";

      // Fetch current consultation
      const consultation = await getConsultationById(id);
      if (!consultation) {
        return res.status(404).json({ error: "Consultation ticket not found" });
      }

      const oldNotes = consultation.notes || "";
      const separator = oldNotes ? "\n\n--- [Audio Note Summary: " + new Date().toLocaleString() + "] ---\n" : "--- [Audio Note Summary: " + new Date().toLocaleString() + "] ---\n";
      const updatedNotes = `${oldNotes}${separator}${transcribedText}`;

      const updated = await updateConsultationNotes(id, updatedNotes);
      res.json({ success: true, text: transcribedText, consultation: updated });
    } catch (error: any) {
      console.error("Gemini audio transcription error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete/Archive consultation request
  app.delete("/api/consultations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteConsultation(id);
      res.json({ success: true, deleted });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Automatically seed database on startup if empty
  try {
    const existingReviews = await getAllReviews();
    if (existingReviews.length === 0) {
      console.log("Seeding database with initial reviews...");
      const initialReviewsSeed = [
        {
          id: "rev-1",
          author: "Mian Bashir Ahmad",
          role: "Land Owner (Civil Litigation Winner)",
          text: "Gurmani Sahib contested my land partition case in the High Court with absolute genius. His presentation on revenue logs and Pakistani precedents got us a stay order on day one.",
          rating: 5,
          date: "2026-05-15",
        },
        {
          id: "rev-2",
          author: "Sardar Saleem Jan",
          role: "Business Owner",
          text: "Our corporate company had a long tax resolution issue. He represented us at appellate tribunals and saved our reputation. Very professional counsel.",
          rating: 5,
          date: "2026-06-01",
        },
        {
          id: "rev-3",
          author: "Kaneez Fatima",
          role: "Khula & Custody Petitioner",
          text: "Advocate Shafiq Gurmani secured the custody of my two children in a very difficult custody case. He fought tirelessly and showed deep empathy throughout.",
          rating: 5,
          date: "2026-06-10",
        }
      ];

      for (const rev of initialReviewsSeed) {
        await createReview(rev);
      }
    }

    const existingConsultations = await getAllConsultations();
    if (existingConsultations.length === 0) {
      console.log("Seeding database with initial consultations...");
      const d = new Date();
      const getFormattedDate = (offset: number) => {
        const copy = new Date(d);
        copy.setDate(copy.getDate() + offset);
        return copy.toISOString().split("T")[0];
      };

      const initialConsultationsSeed = [
        {
          id: "JD-2026-01",
          name: "Muhammad Latif Ansari",
          phone: "03007654321",
          service: "Criminal Defense & Appeals",
          date: getFormattedDate(0),
          urgency: "Urgent",
          details: "Seeking immediate bail application hearing at the High Court Bench in the matter of false FIR filed regarding business transaction dispute.",
          status: "Pending",
          notes: "Requires urgent files review of High Court case diary on Friday afternoon.",
          timestamp: "2026-06-18T10:14:00",
        },
        {
          id: "JD-2026-02",
          name: "Sardar Abdul Ghani",
          phone: "03335559876",
          service: "Civil Suits & Land Disputes",
          date: getFormattedDate(1),
          urgency: "Normal",
          details: "Need land partition deed verification and drafting of a stay order request regarding ancestral farmland in Tehsil Multan.",
          status: "Scheduled",
          notes: "Client advised to bring original Patwari copy of fard registry.",
          timestamp: "2026-06-18T14:30:00",
        },
        {
          id: "JD-2026-03",
          name: "Dr. Amna Shah",
          phone: "03219988776",
          service: "Corporate & Tax Consultation",
          date: getFormattedDate(10),
          urgency: "Normal",
          details: "Registration of new medical diagnostics company with SECP and setting up commercial trademark contracts.",
          status: "Completed",
          notes: "Company setup forms registered successfully with direct registration receipt.",
          timestamp: "2026-06-19T09:12:00",
        }
      ];

      for (const consult of initialConsultationsSeed) {
        await createConsultation(consult);
      }
    }
  } catch (seedErr) {
    console.error("Database seeding encountered a warning:", seedErr);
  }

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
