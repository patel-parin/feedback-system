import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

// Form templates created by admins
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  // Store form fields and their types as JSON
  fields: jsonb("fields").notNull(),
  // Unique hash for accessing the form
  accessHash: text("access_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

// Responses to form templates
export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").references(() => formTemplates.id),
  // Store responses as JSON matching the structure of form fields
  responses: jsonb("responses").notNull(),
  respondent: text("respondent").notNull(),
  email: text("email"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertFormTemplateSchema = createInsertSchema(formTemplates).pick({
  title: true,
  description: true,
  createdBy: true,
  fields: true,
  accessHash: true,
  active: true,
});

export const insertFormResponseSchema = createInsertSchema(formResponses).pick({
  formId: true,
  responses: true,
  respondent: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFormTemplate = Omit<z.infer<typeof insertFormTemplateSchema>, 'createdBy'> & {
  createdBy?: string;
};
export type FormTemplate = typeof formTemplates.$inferSelect;

export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
export type FormResponse = typeof formResponses.$inferSelect;

// Additional schemas for validation
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Field types for form builder
export const formFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "select", "radio", "checkbox", "email"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
});

export const formFieldsSchema = z.array(formFieldSchema);

// Schema for creating a new form template
export const createFormTemplateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string(),
  fields: formFieldsSchema.min(1, "Form must have at least one field"),
});

// Schema for submitting a form response
export const submitFormResponseSchema = z.object({
  formId: z.number(),
  responses: z.record(z.string(), z.any()),
  respondent: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
});
