import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectMongoose } from "./mongodb";
import { User, FormTemplate, FormResponse } from "./models";

const app = express();
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

// Initialize MongoDB and add sample data if needed
async function initializeDatabase() {
  await connectMongoose();
  
  try {
    // Check if we need to initialize with sample data
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Create admin user
      const adminUser = new User({
        email: "admin@example.com",
        password: "admin123",
        isAdmin: true
      });
      await adminUser.save();
      
      // Create sample form
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
        accessHash: "123456789abcdef0",
        active: true
      });
      await formTemplate.save();
      
      console.log("Database initialized with sample data");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    // Don't throw here, just log the error
  }
}

// Initialize the database connection before starting the server
initializeDatabase().catch(console.error);

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error:", err);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Error during startup:", error);
    process.exit(1);
  }
})();
