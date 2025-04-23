import { 
  users, type User, type InsertUser,
  formTemplates, type FormTemplate, type InsertFormTemplate,
  formResponses, type FormResponse, type InsertFormResponse
} from "@shared/schema";
import { randomBytes } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private formTemplatesMap: Map<number, FormTemplate>;
  private formResponsesMap: Map<number, FormResponse>;
  private userIdCounter: number;
  private formTemplateIdCounter: number;
  private formResponseIdCounter: number;

  constructor() {
    this.users = new Map();
    this.formTemplatesMap = new Map();
    this.formResponsesMap = new Map();
    this.userIdCounter = 1;
    this.formTemplateIdCounter = 1;
    this.formResponseIdCounter = 1;
    
    // Initialize with default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Create a sample form template
    this.createFormTemplate({
      title: "Customer Satisfaction Survey",
      description: "Please help us improve our services by completing this short survey.",
      createdBy: 1,
      fields: [
        {
          id: "name",
          label: "Your Name",
          type: "text",
          required: true,
          placeholder: "Enter your full name"
        },
        {
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
          placeholder: "your.email@example.com"
        },
        {
          id: "satisfaction",
          label: "How satisfied are you with our service?",
          type: "radio",
          required: true,
          options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
        },
        {
          id: "usage",
          label: "How often do you use our product/service?",
          type: "select",
          required: true,
          options: ["Daily", "Weekly", "Monthly", "Rarely", "First time"]
        },
        {
          id: "feedback",
          label: "Any additional feedback or suggestions?",
          type: "textarea",
          required: false,
          placeholder: "Share your thoughts with us..."
        }
      ],
      active: true
    });
    
    // Add a sample response to the form
    this.createFormResponse({
      formId: 1,
      respondent: "John Doe",
      email: "john.doe@example.com",
      responses: {
        name: "John Doe",
        email: "john.doe@example.com",
        satisfaction: "Satisfied",
        usage: "Weekly",
        feedback: "Your customer service team is excellent!"
      }
    });
  }

  // Helper to generate a unique hash for form access
  private generateAccessHash(): string {
    return randomBytes(16).toString('hex');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }
  
  // Form template methods
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    return Array.from(this.formTemplatesMap.values());
  }
  
  async getFormTemplateById(id: number): Promise<FormTemplate | undefined> {
    return this.formTemplatesMap.get(id);
  }
  
  async getFormTemplateByHash(accessHash: string): Promise<FormTemplate | undefined> {
    return Array.from(this.formTemplatesMap.values()).find(
      (template) => template.accessHash === accessHash
    );
  }
  
  async getFormTemplatesByCreator(creatorId: number): Promise<FormTemplate[]> {
    return Array.from(this.formTemplatesMap.values()).filter(
      (template) => template.createdBy === creatorId
    );
  }
  
  async createFormTemplate(templateData: Omit<InsertFormTemplate, "accessHash">): Promise<FormTemplate> {
    const id = this.formTemplateIdCounter++;
    const accessHash = this.generateAccessHash();
    const createdAt = new Date();
    
    const template: FormTemplate = {
      ...templateData, 
      id,
      accessHash,
      createdAt,
      createdBy: templateData.createdBy ?? null,
      active: templateData.active ?? true
    };
    
    this.formTemplatesMap.set(id, template);
    return template;
  }
  
  async updateFormTemplate(id: number, updates: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined> {
    const template = this.formTemplatesMap.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates };
    this.formTemplatesMap.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteFormTemplate(id: number): Promise<boolean> {
    return this.formTemplatesMap.delete(id);
  }
  
  // Form response methods
  async getAllFormResponses(): Promise<FormResponse[]> {
    return Array.from(this.formResponsesMap.values());
  }
  
  async getFormResponseById(id: number): Promise<FormResponse | undefined> {
    return this.formResponsesMap.get(id);
  }
  
  async getFormResponsesByForm(formId: number): Promise<FormResponse[]> {
    return Array.from(this.formResponsesMap.values()).filter(
      (response) => response.formId === formId
    );
  }
  
  async createFormResponse(responseData: InsertFormResponse): Promise<FormResponse> {
    const id = this.formResponseIdCounter++;
    const submittedAt = new Date();
    
    const response: FormResponse = {
      ...responseData,
      id,
      submittedAt,
      formId: responseData.formId ?? null,
      email: responseData.email ?? null
    };
    
    this.formResponsesMap.set(id, response);
    return response;
  }
  
  async deleteFormResponse(id: number): Promise<boolean> {
    return this.formResponsesMap.delete(id);
  }
  
  // Statistics
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

export const storage = new MemStorage();
