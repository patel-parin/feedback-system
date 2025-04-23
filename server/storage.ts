import { 
  users, type User, type InsertUser,
  formTemplates, type FormTemplate, type InsertFormTemplate,
  formResponses, type FormResponse, type InsertFormResponse
} from "@shared/schema";
import { randomBytes } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Form template methods
  getAllFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplateById(id: number): Promise<FormTemplate | undefined>;
  getFormTemplateByHash(accessHash: string): Promise<FormTemplate | undefined>;
  getFormTemplatesByCreator(creatorId: number): Promise<FormTemplate[]>;
  createFormTemplate(template: Omit<InsertFormTemplate, "accessHash">): Promise<FormTemplate>;
  updateFormTemplate(id: number, updates: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined>;
  deleteFormTemplate(id: number): Promise<boolean>;
  
  // Form response methods
  getAllFormResponses(): Promise<FormResponse[]>;
  getFormResponseById(id: number): Promise<FormResponse | undefined>;
  getFormResponsesByForm(formId: number): Promise<FormResponse[]>;
  createFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  deleteFormResponse(id: number): Promise<boolean>;
  
  // Statistics
  getFormStats(formId: number): Promise<any>;
}

// Helper to generate a unique hash for form access
function generateAccessHash(): string {
  return randomBytes(16).toString('hex');
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    return await db.select().from(formTemplates);
  }
  
  async getFormTemplateById(id: number): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id));
    return template;
  }
  
  async getFormTemplateByHash(accessHash: string): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates).where(eq(formTemplates.accessHash, accessHash));
    return template;
  }
  
  async getFormTemplatesByCreator(creatorId: number): Promise<FormTemplate[]> {
    return await db.select().from(formTemplates).where(eq(formTemplates.createdBy, creatorId));
  }
  
  async createFormTemplate(templateData: Omit<InsertFormTemplate, "accessHash">): Promise<FormTemplate> {
    const accessHash = generateAccessHash();
    
    const [template] = await db
      .insert(formTemplates)
      .values({
        ...templateData,
        accessHash
      })
      .returning();
      
    return template;
  }
  
  async updateFormTemplate(id: number, updates: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(formTemplates)
      .set(updates)
      .where(eq(formTemplates.id, id))
      .returning();
      
    return updatedTemplate;
  }
  
  async deleteFormTemplate(id: number): Promise<boolean> {
    try {
      const [deletedTemplate] = await db
        .delete(formTemplates)
        .where(eq(formTemplates.id, id))
        .returning({ id: formTemplates.id });
        
      return !!deletedTemplate;
    } catch (error) {
      console.error("Error deleting form template:", error);
      return false;
    }
  }
  
  async getAllFormResponses(): Promise<FormResponse[]> {
    return await db.select().from(formResponses);
  }
  
  async getFormResponseById(id: number): Promise<FormResponse | undefined> {
    const [response] = await db.select().from(formResponses).where(eq(formResponses.id, id));
    return response;
  }
  
  async getFormResponsesByForm(formId: number): Promise<FormResponse[]> {
    return await db.select().from(formResponses).where(eq(formResponses.formId, formId));
  }
  
  async createFormResponse(responseData: InsertFormResponse): Promise<FormResponse> {
    const [response] = await db
      .insert(formResponses)
      .values(responseData)
      .returning();
      
    return response;
  }
  
  async deleteFormResponse(id: number): Promise<boolean> {
    try {
      const [deletedResponse] = await db
        .delete(formResponses)
        .where(eq(formResponses.id, id))
        .returning({ id: formResponses.id });
        
      return !!deletedResponse;
    } catch (error) {
      console.error("Error deleting form response:", error);
      return false;
    }
  }
  
  async getFormStats(formId: number): Promise<any> {
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
  }
}

// Initialize database storage
export const storage = new DatabaseStorage();
