import { 
  users, type User, type InsertUser,
  feedback, type Feedback, type InsertFeedback,
  categories, type Category, type InsertCategory
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Feedback methods
  getAllFeedback(): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  getFeedbackBySubmitter(submitter: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined>;
  updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<boolean>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Statistics
  getStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private feedbackItems: Map<number, Feedback>;
  private categoriesMap: Map<number, Category>;
  private userIdCounter: number;
  private feedbackIdCounter: number;
  private categoryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.feedbackItems = new Map();
    this.categoriesMap = new Map();
    this.userIdCounter = 1;
    this.feedbackIdCounter = 1;
    this.categoryIdCounter = 1;
    
    // Initialize with default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Initialize with default categories
    this.createCategory({ name: "Bug" });
    this.createCategory({ name: "Feature" });
    this.createCategory({ name: "UI/UX" });
    this.createCategory({ name: "Performance" });
    this.createCategory({ name: "Other" });
    
    // Add some sample feedback items
    this.createFeedback({
      title: "Login page freezes on Safari",
      description: "When attempting to log in using Safari on macOS, the page freezes after clicking the login button. This does not happen on Chrome or Firefox.",
      category: "Bug",
      priority: "high",
      status: "new",
      submitterId: 1,
      submitter: "admin"
    });
    
    this.createFeedback({
      title: "Add dark mode to the application",
      description: "Would be great to have a dark mode option for better usability at night and to reduce eye strain.",
      category: "Feature",
      priority: "medium",
      status: "in-progress",
      submitterId: 1,
      submitter: "admin"
    });
    
    this.createFeedback({
      title: "Improve loading time of product page",
      description: "The product page takes too long to load, especially on mobile devices. Please optimize the images and reduce JavaScript execution time.",
      category: "Performance",
      priority: "low",
      status: "resolved",
      submitterId: 1,
      submitter: "admin"
    });
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Feedback methods
  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbackItems.values());
  }
  
  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    return this.feedbackItems.get(id);
  }
  
  async getFeedbackBySubmitter(submitter: string): Promise<Feedback[]> {
    return Array.from(this.feedbackItems.values()).filter(
      (feedback) => feedback.submitter === submitter
    );
  }
  
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const createdAt = new Date();
    const feedback: Feedback = { 
      ...insertFeedback, 
      id,
      createdAt
    };
    this.feedbackItems.set(id, feedback);
    return feedback;
  }
  
  async updateFeedbackStatus(id: number, status: string): Promise<Feedback | undefined> {
    const feedback = this.feedbackItems.get(id);
    if (!feedback) return undefined;
    
    const updatedFeedback = { ...feedback, status };
    this.feedbackItems.set(id, updatedFeedback);
    return updatedFeedback;
  }
  
  async updateFeedback(id: number, updates: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const feedback = this.feedbackItems.get(id);
    if (!feedback) return undefined;
    
    const updatedFeedback = { ...feedback, ...updates };
    this.feedbackItems.set(id, updatedFeedback);
    return updatedFeedback;
  }
  
  async deleteFeedback(id: number): Promise<boolean> {
    return this.feedbackItems.delete(id);
  }
  
  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categoriesMap.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categoriesMap.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categoriesMap.set(id, category);
    return category;
  }
  
  async getStats(): Promise<any> {
    const feedbackItems = Array.from(this.feedbackItems.values());
    
    // Count by status
    const statusCounts = {
      new: feedbackItems.filter(fb => fb.status === 'new').length,
      inProgress: feedbackItems.filter(fb => fb.status === 'in-progress').length,
      resolved: feedbackItems.filter(fb => fb.status === 'resolved').length
    };
    
    // Count by priority
    const priorityCounts = {
      high: feedbackItems.filter(fb => fb.priority === 'high').length,
      medium: feedbackItems.filter(fb => fb.priority === 'medium').length,
      low: feedbackItems.filter(fb => fb.priority === 'low').length
    };
    
    // Count by category
    const categoryCounts = {};
    feedbackItems.forEach(fb => {
      if (!categoryCounts[fb.category]) {
        categoryCounts[fb.category] = 0;
      }
      categoryCounts[fb.category]++;
    });
    
    return {
      total: feedbackItems.length,
      statusDistribution: {
        new: statusCounts.new,
        inProgress: statusCounts.inProgress,
        resolved: statusCounts.resolved
      },
      priorityDistribution: priorityCounts,
      categoryDistribution: categoryCounts
    };
  }
}

export const storage = new MemStorage();
