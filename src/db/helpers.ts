import { db } from './index.ts';
import { users, consultations, reviews, statusHistory } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// User helper
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Failed to get or create user profile.", { cause: error });
  }
}

// Get user by UID
export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user by uid:", error);
    throw new Error("Failed to retrieve user profile.", { cause: error });
  }
}

// Get single consultation by ID with its status history
export async function getConsultationById(id: string) {
  try {
    const result = await db.query.consultations.findFirst({
      where: eq(consultations.id, id),
      with: {
        statusHistory: true,
      },
    });
    return result || null;
  } catch (error) {
    console.error("Failed to get consultation by id:", error);
    throw new Error("Failed to query consultation by id.", { cause: error });
  }
}

// Consultation queries
export async function getAllConsultations() {
  try {
    return await db.query.consultations.findMany({
      with: {
        statusHistory: true,
      },
      orderBy: (c, { desc }) => [desc(c.timestamp)],
    });
  } catch (error) {
    console.error("Failed to get all consultations:", error);
    throw new Error("Failed to query consultations from database.", { cause: error });
  }
}

export async function getUserConsultations(userId: number) {
  try {
    return await db.query.consultations.findMany({
      where: eq(consultations.userId, userId),
      with: {
        statusHistory: true,
      },
      orderBy: (c, { desc }) => [desc(c.timestamp)],
    });
  } catch (error) {
    console.error("Failed to get user consultations:", error);
    throw new Error("Failed to query user consultations from database.", { cause: error });
  }
}

export async function createConsultation(data: {
  id: string;
  name: string;
  phone: string;
  service: string;
  date: string;
  urgency: string;
  details: string;
  status: string;
  notes?: string | null;
  documents?: string | null;
  timestamp: string;
  userId?: number | null;
}) {
  try {
    const result = await db.insert(consultations).values(data).returning();
    
    // Log the initial status in status history
    try {
      await db.insert(statusHistory).values({
        consultationId: data.id,
        status: data.status,
        notes: "Docket registered in Justice Digital Desk registry",
        timestamp: new Date().toISOString(),
      });
    } catch (historyErr) {
      console.error("Warning: Failed to log initial status history:", historyErr);
    }

    return result[0];
  } catch (error) {
    console.error("Failed to create consultation:", error);
    throw new Error("Failed to save consultation request in database.", { cause: error });
  }
}

export async function updateConsultationStatus(id: string, status: string, changeNotes?: string) {
  try {
    // Get existing to find current status
    const existing = await db.select().from(consultations).where(eq(consultations.id, id)).limit(1);
    const oldStatus = existing[0]?.status || "Unknown";

    await db.update(consultations)
      .set({ status })
      .where(eq(consultations.id, id));

    // Log the change in status history
    try {
      await db.insert(statusHistory).values({
        consultationId: id,
        status: status,
        notes: changeNotes || `Status updated from '${oldStatus}' to '${status}'`,
        timestamp: new Date().toISOString(),
      });
    } catch (historyErr) {
      console.error("Warning: Failed to log status history update:", historyErr);
    }

    // Return the updated consultation with full statusHistory relations
    return await getConsultationById(id);
  } catch (error) {
    console.error("Failed to update consultation status:", error);
    throw new Error("Failed to update consultation status in database.", { cause: error });
  }
}

export async function updateConsultationNotes(id: string, notes: string) {
  try {
    await db.update(consultations)
      .set({ notes })
      .where(eq(consultations.id, id));
    
    return await getConsultationById(id);
  } catch (error) {
    console.error("Failed to update consultation notes:", error);
    throw new Error("Failed to update consultation notes in database.", { cause: error });
  }
}

export async function updateConsultationDocuments(id: string, documents: string) {
  try {
    await db.update(consultations)
      .set({ documents })
      .where(eq(consultations.id, id));
    
    return await getConsultationById(id);
  } catch (error) {
    console.error("Failed to update consultation documents:", error);
    throw new Error("Failed to update consultation documents in database.", { cause: error });
  }
}

export async function deleteConsultation(id: string) {
  try {
    const result = await db.delete(consultations).where(eq(consultations.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to delete consultation:", error);
    throw new Error("Failed to delete consultation request from database.", { cause: error });
  }
}

// Review queries
export async function getAllReviews() {
  try {
    return await db.select().from(reviews).orderBy(desc(reviews.date));
  } catch (error) {
    console.error("Failed to get all reviews:", error);
    throw new Error("Failed to query reviews from database.", { cause: error });
  }
}

export async function createReview(data: {
  id: string;
  author: string;
  role: string;
  text: string;
  rating: number;
  date: string;
  userId?: number | null;
}) {
  try {
    const result = await db.insert(reviews).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to create review:", error);
    throw new Error("Failed to create review in database.", { cause: error });
  }
}
