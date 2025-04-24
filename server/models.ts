import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

export interface User {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  isAdmin: boolean;
}

export const UserSchema = new mongoose.Schema<User>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

export const User = mongoose.model<User>('User', UserSchema);

// Form template schema
const formTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fields: { type: Array, required: true },
  accessHash: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

// Form response schema
const formResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormTemplate', required: true },
  responses: { type: Object, required: true },
  respondent: { type: String, required: true },
  email: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

// Add a pre-save hook to generate an access hash for form templates
formTemplateSchema.pre('save', function(next) {
  if (!this.accessHash) {
    this.accessHash = randomBytes(16).toString('hex');
  }
  next();
});

// Export models
export const FormTemplate = mongoose.model('FormTemplate', formTemplateSchema);
export const FormResponse = mongoose.model('FormResponse', formResponseSchema);

// Type definitions to match our previous PostgreSQL types
export type FormTemplateDocument = mongoose.Document & {
  id: string;
  title: string;
  description: string;
  createdBy: string | null;
  fields: any[];
  accessHash: string;
  createdAt: Date;
  active: boolean;
};

export type FormResponseDocument = mongoose.Document & {
  id: string;
  formId: string;
  responses: Record<string, any>;
  respondent: string;
  email: string | null;
  submittedAt: Date;
};