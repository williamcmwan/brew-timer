import dotenv from 'dotenv';
import express from 'express';

// Load .env from project root
dotenv.config({ path: '../.env' });
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeDatabase } from './db/schema.js';
import recipesRoutes from './routes/recipes.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3003;

// Data directory - use process.cwd() which is the server directory
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Data directory:', dataDir);

// Initialize database
initializeDatabase();

const app = express();

// Trust proxy - needed when behind reverse proxy (nginx, etc.) for rate limiting to work correctly
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for SPA compatibility
}));

// CORS configuration - allow all origins for the simplified timer app
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-ID', 'X-Admin-Key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve template images as static files
const templateImagesDir = path.join(dataDir, 'template-images');
if (fs.existsSync(templateImagesDir)) {
  app.use('/template-images', express.static(templateImagesDir));
  console.log('📸 Serving template images from:', templateImagesDir);
}

// Serve recipe images as static files
const recipeImagesDir = path.join(dataDir, 'recipe-images');
if (!fs.existsSync(recipeImagesDir)) {
  fs.mkdirSync(recipeImagesDir, { recursive: true });
}
app.use('/recipe-images', express.static(recipeImagesDir));
console.log('📸 Serving recipe images from:', recipeImagesDir);

// API routes
app.use('/api/recipes', recipesRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'coffee-timer-api'
  });
});

// Serve static files from client dist in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    
    // Handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Coffee Timer API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database: ${dataDir}/coffee-timer.db`);
});

export default app;