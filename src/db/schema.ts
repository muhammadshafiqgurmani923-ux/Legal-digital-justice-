import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'consultations' table
export const consultations = pgTable('consultations', {
  id: text('id').primaryKey(), // ticket id e.g. JD-2026-01
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  service: text('service').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  urgency: text('urgency').notNull(), // 'Urgent' | 'Normal'
  details: text('details').notNull(),
  status: text('status').notNull(), // 'Pending' | 'Scheduled' | 'Completed'
  notes: text('notes'),
  documents: text('documents'), // JSON array of document checklist items: [{ id, name, checked }]
  timestamp: text('timestamp').notNull(),
  userId: integer('user_id').references(() => users.id),
});

// Define the 'status_history' table
export const statusHistory = pgTable('status_history', {
  id: serial('id').primaryKey(),
  consultationId: text('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  notes: text('notes'),
  timestamp: text('timestamp').notNull(), // ISO string e.g. "2026-06-30T05:15:11"
});

// Define the 'reviews' table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  author: text('author').notNull(),
  role: text('role').notNull(),
  text: text('text').notNull(),
  rating: integer('rating').notNull(),
  date: text('date').notNull(),
  userId: integer('user_id').references(() => users.id),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  consultations: many(consultations),
  reviews: many(reviews),
}));

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  user: one(users, {
    fields: [consultations.userId],
    references: [users.id],
  }),
  statusHistory: many(statusHistory),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  consultation: one(consultations, {
    fields: [statusHistory.consultationId],
    references: [consultations.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));
