import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  createFormTemplateSchema, 
  submitFormResponseSchema, 
  formFieldSchema 
} from "@shared/schema";
import { z } from "zod";
import type { User } from './models';
import mongoose from 'mongoose';

// Extend the Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: AuthenticatedRequest, res: Response, next: Function) => {
    // For a real app, check user session
    // For this demo, we'll implement a simple check
    if (!req.query.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }
    
    // Set the user object on the request
    req.user = {
      _id: new mongoose.Types.ObjectId(req.query.userId as string),
      email: 'admin@example.com', // This would come from the session in a real app
      password: '', // This would be hashed in a real app
      isAdmin: true
    };
    
    next();
  };
  
  // No auth needed middleware - just logs the access
  const logPublicAccess = (req: Request, res: Response, next: Function) => {
    console.log(`Public access to ${req.path}`);
    next();
  };

  // Auth routes
  // User registration
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, isAdmin } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      
      // Create new user
      const newUser = await storage.createUser({
        email,
        password, // In a production app, this would be hashed
        isAdmin: !!isAdmin
      });
      
      // Return user data (excluding password)
      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to create user account' });
    }
  });
  
  // User login
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // In a real app, you would set up a session here
      res.status(200).json({ 
        _id: user._id, 
        email: user.email, 
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Form Templates Routes (Admin only)
  app.get('/api/forms', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const templates = await storage.getAllFormTemplates();
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form templates' });
    }
  });
  
  app.post('/api/forms', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const formData = createFormTemplateSchema.parse(req.body);
      
      // Ensure description has a value (MongoDB validation requires it)
      const description = formData.description?.trim() 
        ? formData.description 
        : 'No description provided';
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const newForm = await storage.createFormTemplate({
        ...formData,
        description,
        active: true,
        createdBy: req.user._id
      });
      
      res.status(201).json(newForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Form creation error:", error);
      res.status(500).json({ message: 'Failed to create form template' });
    }
  });
  
  app.get('/api/forms/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const template = await storage.getFormTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: 'Form template not found' });
      }
      
      res.status(200).json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form template' });
    }
  });
  
  app.put('/api/forms/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      
      const updatedTemplate = await storage.updateFormTemplate(id, updates);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: 'Form template not found' });
      }
      
      res.status(200).json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update form template' });
    }
  });
  
  app.delete('/api/forms/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteFormTemplate(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Form template not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete form template' });
    }
  });
  
  // Public form access
  app.get('/api/public/forms/:hash', logPublicAccess, async (req: Request, res: Response) => {
    try {
      const hash = req.params.hash;
      const template = await storage.getFormTemplateByHash(hash);
      
      if (!template || !template.active) {
        return res.status(404).json({ message: 'Form not found or inactive' });
      }
      
      // Return only what's needed to render the form (no internal data)
      res.status(200).json({
        id: template.id,
        title: template.title,
        description: template.description,
        fields: template.fields
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form' });
    }
  });
  
  // Submit form response
  app.post('/api/public/forms/:id/submit', logPublicAccess, async (req: Request, res: Response) => {
    try {
      const formId = req.params.id;
      const template = await storage.getFormTemplateById(formId);
      
      if (!template || !template.active) {
        return res.status(404).json({ message: 'Form not found or inactive' });
      }
      
      // Validate form data and convert to match MongoDB type expectations
      const validatedData = submitFormResponseSchema.parse({
        ...req.body,
        formId: parseInt(formId) // Keep as number for validation
      });
      
      // Create form response, making sure to use string formId for MongoDB
      const response = await storage.createFormResponse({
        respondent: validatedData.respondent,
        responses: validatedData.responses,
        formId: new mongoose.Types.ObjectId(formId),
        email: validatedData.email || null
      });
      
      res.status(201).json({ success: true, responseId: response.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Form submission error:", error);
      res.status(500).json({ message: 'Failed to submit form response' });
    }
  });
  
  // Get responses for a form (Admin only)
  app.get('/api/forms/:id/responses', authenticateUser, async (req, res) => {
    try {
      const formId = req.params.id;
      const responses = await storage.getFormResponsesByForm(formId);
      res.status(200).json(responses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form responses' });
    }
  });
  
  // Get statistics for a form (Admin only)
  app.get('/api/forms/:id/stats', authenticateUser, async (req, res) => {
    try {
      const formId = req.params.id;
      const stats = await storage.getFormStats(formId);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form statistics' });
    }
  });
  
  // Utility endpoint to get field types for form builder
  app.get('/api/form-field-types', authenticateUser, async (req, res) => {
    try {
      const fieldTypes = formFieldSchema.shape.type.options;
      res.status(200).json(fieldTypes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch field types' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
