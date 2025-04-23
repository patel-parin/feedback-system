import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFeedbackSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: Request, res: Response, next: Function) => {
    // For a real app, check user session
    // For this demo, we'll implement a simple check
    if (req.path.includes('admin') && !req.query.isAdmin) {
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

  // Feedback routes
  app.get('/api/feedback', async (req, res) => {
    try {
      const feedbackItems = await storage.getAllFeedback();
      res.status(200).json(feedbackItems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });
  
  app.get('/api/feedback/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const feedback = await storage.getFeedbackById(id);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      res.status(200).json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });
  
  app.get('/api/feedback/user/:username', async (req, res) => {
    try {
      const username = req.params.username;
      const feedbackItems = await storage.getFeedbackBySubmitter(username);
      res.status(200).json(feedbackItems);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user feedback' });
    }
  });
  
  app.post('/api/feedback', async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(req.body);
      const newFeedback = await storage.createFeedback(feedbackData);
      res.status(201).json(newFeedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: 'Failed to create feedback' });
    }
  });
  
  app.patch('/api/feedback/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['new', 'in-progress', 'resolved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const updatedFeedback = await storage.updateFeedbackStatus(id, status);
      
      if (!updatedFeedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      res.status(200).json(updatedFeedback);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update feedback status' });
    }
  });
  
  app.put('/api/feedback/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedFeedback = await storage.updateFeedback(id, updates);
      
      if (!updatedFeedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      res.status(200).json(updatedFeedback);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update feedback' });
    }
  });
  
  app.delete('/api/feedback/:id', authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFeedback(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete feedback' });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  // Stats route
  app.get('/api/stats', authenticateUser, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
