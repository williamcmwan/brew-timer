import express from 'express';
import { db } from '../db/schema.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'data', 'template-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Admin authentication middleware
const adminAuth = (req: any, res: any, next: any) => {
  console.log('Admin auth middleware hit:', req.path);
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  const validAdminKey = process.env.ADMIN_KEY || 'coffee-admin-2024';
  
  console.log('Admin key provided:', adminKey);
  console.log('Valid admin key:', validAdminKey);
  
  if (!adminKey || adminKey !== validAdminKey) {
    console.log('Admin auth failed');
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  
  console.log('Admin auth successful');
  next();
};

// Photo upload endpoint
router.post('/upload-photo', adminAuth, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const relativePath = `/template-images/${req.file.filename}`;
    res.json({ path: relativePath });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get all recipe templates
router.get('/templates', adminAuth, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, ratio, dose, photo, process, process_steps, 
             water, temperature, brew_time, created_at, updated_at
      FROM recipe_templates 
      ORDER BY name
    `);
    
    const templates = stmt.all().map((template: any) => {
      return {
        id: template.id.toString(),
        name: template.name,
        ratio: template.ratio,
        dose: template.dose,
        photo: template.photo,
        process: template.process,
        water: template.water,
        temperature: template.temperature,
        brewTime: template.brew_time, // Convert brew_time to brewTime
        processSteps: template.process_steps ? JSON.parse(template.process_steps) : undefined,
        created_at: template.created_at,
        updated_at: template.updated_at
      };
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching recipe templates:', error);
    res.status(500).json({ error: 'Failed to fetch recipe templates' });
  }
});

// Create new recipe template
router.post('/templates', adminAuth, (req, res) => {
  try {
    const { 
      name, ratio, dose, photo, process, processSteps, 
      water, temperature, brewTime 
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO recipe_templates 
      (name, ratio, dose, photo, process, process_steps, grind_size, water, yield, 
       temperature, brew_time, grinder_model, brewer_model, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      name,
      ratio,
      dose,
      photo || null,
      process || null,
      processSteps ? JSON.stringify(processSteps) : null,
      null, // grind_size - no longer used
      water,
      null, // yield - no longer used
      temperature,
      brewTime,
      null, // grinder_model - set to null
      null  // brewer_model - set to null
    );

    const newTemplate = {
      id: result.lastInsertRowid.toString(),
      name,
      ratio,
      dose,
      photo,
      process,
      processSteps,
      water,
      temperature,
      brewTime
    };

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating recipe template:', error);
    res.status(500).json({ error: 'Failed to create recipe template' });
  }
});

// Update recipe template
router.put('/templates/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, ratio, dose, photo, process, processSteps, 
      water, temperature, brewTime 
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE recipe_templates 
      SET name = ?, ratio = ?, dose = ?, photo = ?, process = ?, process_steps = ?,
          grind_size = ?, water = ?, yield = ?, temperature = ?, brew_time = ?, 
          grinder_model = ?, brewer_model = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      name,
      ratio,
      dose,
      photo || null,
      process || null,
      processSteps ? JSON.stringify(processSteps) : null,
      null, // grind_size - no longer used
      water,
      null, // yield - no longer used
      temperature,
      brewTime,
      null, // grinder_model - set to null
      null, // brewer_model - set to null
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating recipe template:', error);
    res.status(500).json({ error: 'Failed to update recipe template' });
  }
});

// Delete recipe template
router.delete('/templates/:id', adminAuth, (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM recipe_templates WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe template not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe template:', error);
    res.status(500).json({ error: 'Failed to delete recipe template' });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, (req, res) => {
  try {
    const templatesCount = db.prepare('SELECT COUNT(*) as count FROM recipe_templates').get() as any;
    const guestUsersCount = db.prepare('SELECT COUNT(*) as count FROM guest_users').get() as any;
    const recipesCount = db.prepare('SELECT COUNT(*) as count FROM recipes').get() as any;
    
    const recentActivity = db.prepare(`
      SELECT 'recipe' as type, name, created_at 
      FROM recipes 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    res.json({
      templates: templatesCount.count,
      guestUsers: guestUsersCount.count,
      recipes: recipesCount.count,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;