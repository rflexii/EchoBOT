import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "proposal", "won", "lost"]);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: text("public_id").notNull(),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  visitorPhone: text("visitor_phone"),
  sourceUrl: text("source_url"),
  isLead: boolean("is_lead").default(false).notNull(),
  escalated: boolean("escalated").default(false).notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  publicIdx: uniqueIndex("conversations_public_id_idx").on(t.publicId),
  lastMsgIdx: index("conversations_last_msg_idx").on(t.lastMessageAt),
}));

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  escalated: boolean("escalated").default(false).notNull(),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  latencyMs: integer("latency_ms"),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  convIdx: index("messages_conversation_idx").on(t.conversationId),
  createdIdx: index("messages_created_idx").on(t.createdAt),
}));

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketNumber: text("ticket_number").notNull(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  triggerMessageId: uuid("trigger_message_id").references(() => messages.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  assignedTo: text("assigned_to"),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  visitorPhone: text("visitor_phone"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionNotes: text("resolution_notes"),
  responses: jsonb("responses").$type<any[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  numberIdx: uniqueIndex("tickets_number_idx").on(t.ticketNumber),
  statusIdx: index("tickets_status_idx").on(t.status),
  convIdx: index("tickets_conversation_idx").on(t.conversationId),
}));

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  serviceInterest: text("service_interaction"),
  budget: text("budget"),
  notes: text("notes"),
  status: leadStatusEnum("status").default("new").notNull(),
  assignedTo: text("assigned_to"),
  estimatedValue: integer("estimated_value"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("leads_email_idx").on(t.email),
  statusIdx: index("leads_status_idx").on(t.status),
}));

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex("admins_email_idx").on(t.email),
}));

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  entityIdx: index("activity_entity_idx").on(t.entityType, t.entityId),
  createdIdx: index("activity_created_idx").on(t.createdAt),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  tickets: many(tickets),
  leads: many(leads),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));
export const ticketsRelations = relations(tickets, ({ one }) => ({
  conversation: one(conversations, { fields: [tickets.conversationId], references: [conversations.id] }),
}));
export const leadsRelations = relations(leads, ({ one }) => ({
  conversation: one(conversations, { fields: [leads.conversationId], references: [conversations.id] }),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
