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

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: Request, res: Response, next: Function) => {
    // For a real app, check user session
    // For this demo, we'll implement a simple check
    if (!req.query.isAdmin) {
      return res.status(401).json({ message: 'Unauthorized - Admin access required' });
    }
    next();
  };

  // Auth routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // In a real app, you would set up a session here
      res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Form Templates Routes (Admin only)
  app.get('/api/forms', authenticateUser, async (req, res) => {
    try {
      const templates = await storage.getAllFormTemplates();
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form templates' });
    }
  });
  
  app.post('/api/forms', authenticateUser, async (req, res) => {
    try {
      const formData = createFormTemplateSchema.parse(req.body);
      const creatorId = Number(req.query.userId) || 1; // Default to admin if not specified
      
      const newForm = await storage.createFormTemplate({
        ...formData,
        createdBy: creatorId,
        active: true
      });
      
      res.status(201).json(newForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to create form template' });
    }
  });
  
  app.get('/api/forms/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getFormTemplateById(id);
      
      if (!template) {
        return res.status(404).json({ message: 'Form template not found' });
      }
      
      res.status(200).json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form template' });
    }
  });
  
  app.put('/api/forms/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  
  app.delete('/api/forms/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  app.get('/api/public/forms/:hash', async (req, res) => {
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
  app.post('/api/public/forms/:id/submit', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const template = await storage.getFormTemplateById(formId);
      
      if (!template || !template.active) {
        return res.status(404).json({ message: 'Form not found or inactive' });
      }
      
      // Validate form data
      const responseData = submitFormResponseSchema.parse({
        ...req.body,
        formId
      });
      
      // Create form response
      const response = await storage.createFormResponse(responseData);
      
      res.status(201).json({ success: true, responseId: response.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit form response' });
    }
  });
  
  // Get responses for a form (Admin only)
  app.get('/api/forms/:id/responses', authenticateUser, async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      const responses = await storage.getFormResponsesByForm(formId);
      res.status(200).json(responses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch form responses' });
    }
  });
  
  // Get statistics for a form (Admin only)
  app.get('/api/forms/:id/stats', authenticateUser, async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
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
