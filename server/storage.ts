import { randomBytes } from "crypto";
import { User, FormTemplate, FormResponse } from "./models";
import { connectMongoose } from "./mongodb";
import mongoose from "mongoose";

// Define types that match our previous schema for compatibility
export type UserType = {
  id: string;
  email: string;
  password: string;
  isAdmin: boolean;
};

export type FormTemplateType = {
  id: string;
  title: string;
  description: string;
  createdBy: string | null;
  fields: any[];
  accessHash: string;
  createdAt: Date;
  active: boolean;
};

export type FormResponseType = {
  id: string;
  formId: string;
  responses: Record<string, any>;
  respondent: string;
  email: string | null;
  submittedAt: Date;
};

// Define insert types for compatibility with our APIs
export type InsertUserType = Omit<UserType, "id">;
export type InsertFormTemplateType = Omit<FormTemplateType, "id" | "createdAt" | "accessHash"> & { accessHash?: string };
export type InsertFormResponseType = Omit<FormResponseType, "id" | "submittedAt">;

export interface IStorage {
  // User methods
  getUser(id: string): Promise<UserType | undefined>;
  getUserByEmail(email: string): Promise<UserType | undefined>;
  createUser(user: InsertUserType): Promise<UserType>;
  
  // Form template methods
  getAllFormTemplates(): Promise<FormTemplateType[]>;
  getFormTemplateById(id: string): Promise<FormTemplateType | undefined>;
  getFormTemplateByHash(accessHash: string): Promise<FormTemplateType | undefined>;
  getFormTemplatesByCreator(creatorId: string): Promise<FormTemplateType[]>;
  createFormTemplate(template: Omit<InsertFormTemplateType, "accessHash">): Promise<FormTemplateType>;
  updateFormTemplate(id: string, updates: Partial<InsertFormTemplateType>): Promise<FormTemplateType | undefined>;
  deleteFormTemplate(id: string): Promise<boolean>;
  
  // Form response methods
  getAllFormResponses(): Promise<FormResponseType[]>;
  getFormResponseById(id: string): Promise<FormResponseType | undefined>;
  getFormResponsesByForm(formId: string): Promise<FormResponseType[]>;
  createFormResponse(response: InsertFormResponseType): Promise<FormResponseType>;
  deleteFormResponse(id: string): Promise<boolean>;
  
  // Statistics
  getFormStats(formId: string): Promise<any>;
}

// Helper to generate a unique hash for form access
function generateAccessHash(): string {
  return randomBytes(16).toString('hex');
}

// Helper to convert MongoDB document to plain object with id field
function documentToPlain<T>(doc: mongoose.Document | null): T | undefined {
  if (!doc) return undefined;
  
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  
  return obj as T;
}

export class MongoDBStorage implements IStorage {
  constructor() {
    // Ensure the MongoDB connection is established
    connectMongoose();
  }

  async getUser(id: string): Promise<UserType | undefined> {
    try {
      const user = await User.findById(id);
      return documentToPlain<UserType>(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<UserType | undefined> {
    try {
      const user = await User.findOne({ email });
      return documentToPlain<UserType>(user);
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUserType): Promise<UserType> {
    try {
      const user = new User(insertUser);
      await user.save();
      return documentToPlain<UserType>(user)!;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async getAllFormTemplates(): Promise<FormTemplateType[]> {
    try {
      const templates = await FormTemplate.find();
      return templates.map(template => documentToPlain<FormTemplateType>(template)!);
    } catch (error) {
      console.error("Error fetching form templates:", error);
      return [];
    }
  }
  
  async getFormTemplateById(id: string): Promise<FormTemplateType | undefined> {
    try {
      const template = await FormTemplate.findById(id);
      return documentToPlain<FormTemplateType>(template);
    } catch (error) {
      console.error("Error fetching form template:", error);
      return undefined;
    }
  }
  
  async getFormTemplateByHash(accessHash: string): Promise<FormTemplateType | undefined> {
    try {
      const template = await FormTemplate.findOne({ accessHash });
      return documentToPlain<FormTemplateType>(template);
    } catch (error) {
      console.error("Error fetching form template by hash:", error);
      return undefined;
    }
  }
  
  async getFormTemplatesByCreator(creatorId: string): Promise<FormTemplateType[]> {
    try {
      const templates = await FormTemplate.find({ createdBy: creatorId });
      return templates.map(template => documentToPlain<FormTemplateType>(template)!);
    } catch (error) {
      console.error("Error fetching form templates by creator:", error);
      return [];
    }
  }
  
  async createFormTemplate(templateData: Omit<InsertFormTemplateType, "accessHash">): Promise<FormTemplateType> {
    try {
      const template = new FormTemplate({
        ...templateData,
        accessHash: generateAccessHash()
      });
      
      await template.save();
      return documentToPlain<FormTemplateType>(template)!;
    } catch (error) {
      console.error("Error creating form template:", error);
      throw error;
    }
  }
  
  async updateFormTemplate(id: string, updates: Partial<InsertFormTemplateType>): Promise<FormTemplateType | undefined> {
    try {
      const template = await FormTemplate.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true } // Return the updated document
      );
      
      return documentToPlain<FormTemplateType>(template);
    } catch (error) {
      console.error("Error updating form template:", error);
      return undefined;
    }
  }
  
  async deleteFormTemplate(id: string): Promise<boolean> {
    try {
      const result = await FormTemplate.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting form template:", error);
      return false;
    }
  }
  
  async getAllFormResponses(): Promise<FormResponseType[]> {
    try {
      const responses = await FormResponse.find();
      return responses.map(response => documentToPlain<FormResponseType>(response)!);
    } catch (error) {
      console.error("Error fetching form responses:", error);
      return [];
    }
  }
  
  async getFormResponseById(id: string): Promise<FormResponseType | undefined> {
    try {
      const response = await FormResponse.findById(id);
      return documentToPlain<FormResponseType>(response);
    } catch (error) {
      console.error("Error fetching form response:", error);
      return undefined;
    }
  }
  
  async getFormResponsesByForm(formId: string): Promise<FormResponseType[]> {
    try {
      const responses = await FormResponse.find({ formId });
      return responses.map(response => documentToPlain<FormResponseType>(response)!);
    } catch (error) {
      console.error("Error fetching form responses by form:", error);
      return [];
    }
  }
  
  async createFormResponse(responseData: InsertFormResponseType): Promise<FormResponseType> {
    try {
      const response = new FormResponse(responseData);
      await response.save();
      return documentToPlain<FormResponseType>(response)!;
    } catch (error) {
      console.error("Error creating form response:", error);
      throw error;
    }
  }
  
  async deleteFormResponse(id: string): Promise<boolean> {
    try {
      const result = await FormResponse.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting form response:", error);
      return false;
    }
  }
  
  async getFormStats(formId: string): Promise<any> {
    try {
      const responses = await this.getFormResponsesByForm(formId);
      const template = await this.getFormTemplateById(formId);
      
      if (!template) {
        return { error: "Form template not found" };
      }
      
      // Basic stats
      const stats: {
        totalResponses: number;
        fields: Record<string, any>;
      } = {
        totalResponses: responses.length,
        fields: {}
      };
      
      // If there are no responses, return basic stats
      if (responses.length === 0) {
        return stats;
      }
      
      // Cast fields to the correct type
      const fields = template.fields as Array<{
        id: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
      
      // For each field in the template, calculate relevant statistics
      fields.forEach(field => {
        // Skip if not a radio, select, or checkbox field
        if (!['radio', 'select', 'checkbox'].includes(field.type)) {
          return;
        }
        
        const fieldStats: {
          options: Record<string, number>;
          totalAnswers: number;
        } = {
          options: {},
          totalAnswers: 0
        };
        
        // Count responses for each option
        if (field.options) {
          field.options.forEach((option: string) => {
            fieldStats.options[option] = 0;
          });
        }
        
        // Populate counts
        responses.forEach(response => {
          const responseData = response.responses as Record<string, any>;
          const answer = responseData[field.id];
          
          if (answer) {
            if (Array.isArray(answer)) {
              // Handle checkbox responses (multiple selections)
              answer.forEach((selectedOption: string) => {
                if (fieldStats.options[selectedOption] !== undefined) {
                  fieldStats.options[selectedOption]++;
                  fieldStats.totalAnswers++;
                }
              });
            } else {
              // Handle radio/select responses
              if (fieldStats.options[answer] !== undefined) {
                fieldStats.options[answer]++;
                fieldStats.totalAnswers++;
              }
            }
          }
        });
        
        // Add to overall stats
        stats.fields[field.id] = fieldStats;
      });
      
      return stats;
    } catch (error) {
      console.error("Error calculating form stats:", error);
      return { error: "Failed to calculate statistics" };
    }
  }
}

// Initialize MongoDB storage
export const storage = new MongoDBStorage();
