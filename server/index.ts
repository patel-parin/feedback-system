import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectMongoose } from "./mongodb";
import { User, FormTemplate } from "./models";

// Initialize express app
const app = express();

// Initialize MongoDB connection
connectMongoose().catch(console.error);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for Vercel deployment
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

// Initialize database with sample data if needed
async function initializeDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminUser = new User({
        email: "admin@example.com",
        password: "admin123",
        isAdmin: true
      });
      await adminUser.save();
      
      const formTemplate = new FormTemplate({
        title: "Customer Satisfaction Survey",
        description: "Please help us improve our services by completing this short survey.",
        createdBy: adminUser._id,
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
          }
        ],
        accessHash: "123456789abcdef0",
        active: true
      });
      await formTemplate.save();
      console.log("Database initialized with sample data");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize database
initializeDatabase().catch(console.error);

// Register routes
registerRoutes(app).then(server => {
  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // Setup Vite in development
    setupVite(app, server);
  }

  // Only start the server if not in Vercel
  if (process.env.VERCEL !== "1") {
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  }
}).catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
