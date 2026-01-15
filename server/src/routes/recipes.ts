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
    const uploadDir = path.join(process.cwd(), 'data', 'recipe-images');
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

// Extend Express Request interface to include guestId
interface RequestWithGuestId extends express.Request {
  guestId: string;
}

// Middleware to ensure guest user exists
const ensureGuestUser = (req: any, res: any, next: any) => {
  const guestId = req.headers['x-guest-id'];
  
  if (!guestId) {
    return res.status(400).json({ error: 'Guest ID required' });
  }

  // Create guest user if doesn't exist
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO guest_users (guest_id) VALUES (?)');
    stmt.run(guestId);
    req.guestId = guestId;
    next();
  } catch (error) {
    console.error('Error ensuring guest user:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

// Photo upload endpoint
router.post('/upload-photo', ensureGuestUser, upload.single('photo'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const relativePath = `/recipe-images/${req.file.filename}`;
    res.json({ path: relativePath });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get all recipe templates (public endpoint)
router.get('/templates', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, ratio, dose, photo, process, process_steps, 
             water, temperature, brew_time
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
        processSteps: template.process_steps ? JSON.parse(template.process_steps) : undefined
      };
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching recipe templates:', error);
    res.status(500).json({ error: 'Failed to fetch recipe templates' });
  }
});

// Create recipe from template
router.post('/from-template/:templateId', ensureGuestUser, (req: any, res) => {
  try {
    const { templateId } = req.params;
    const { name } = req.body; // Allow custom name
    
    // Get template
    const templateStmt = db.prepare(`
      SELECT * FROM recipe_templates WHERE id = ?
    `);
    const template = templateStmt.get(templateId) as any;
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Create recipe from template
    const stmt = db.prepare(`
      INSERT INTO recipes (guest_id, name, ratio, dose, photo, process, process_steps, 
                          grind_size, water, yield, temperature, brew_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      req.guestId,
      name || template.name,
      template.ratio,
      template.dose,
      template.photo,
      template.process,
      template.process_steps,
      null, // grind_size - no longer used
      template.water,
      null, // yield - no longer used
      template.temperature,
      template.brew_time
    );

    const newRecipe = {
      id: result.lastInsertRowid.toString(),
      name: name || template.name,
      ratio: template.ratio,
      dose: template.dose,
      photo: template.photo,
      process: template.process,
      processSteps: template.process_steps ? JSON.parse(template.process_steps) : undefined,
      water: template.water,
      temperature: template.temperature,
      brewTime: template.brew_time,
      favorite: false,
      templateId: template.id.toString()
    };

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error creating recipe from template:', error);
    res.status(500).json({ error: 'Failed to create recipe from template' });
  }
});

// Get all recipes for guest
router.get('/', ensureGuestUser, (req: any, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, ratio, dose, photo, process, process_steps, 
             water, temperature, brew_time, favorite
      FROM recipes 
      WHERE guest_id = ? 
      ORDER BY favorite DESC, created_at DESC
    `);
    
    const recipes = stmt.all(req.guestId).map((recipe: any) => ({
      id: recipe.id.toString(),
      name: recipe.name,
      ratio: recipe.ratio,
      dose: recipe.dose,
      photo: recipe.photo,
      process: recipe.process,
      water: recipe.water,
      temperature: recipe.temperature,
      brewTime: recipe.brew_time, // Convert brew_time to brewTime
      favorite: Boolean(recipe.favorite),
      processSteps: recipe.process_steps ? JSON.parse(recipe.process_steps) : undefined
    }));

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Create new recipe
router.post('/', ensureGuestUser, (req: any, res) => {
  try {
    const { name, ratio, dose, photo, process, processSteps, water, temperature, brewTime, favorite } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO recipes (guest_id, name, ratio, dose, photo, process, process_steps, 
                          grind_size, water, yield, temperature, brew_time, favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      req.guestId,
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
      favorite ? 1 : 0
    );

    const newRecipe = {
      id: result.lastInsertRowid.toString(),
      name,
      ratio,
      dose,
      photo,
      process,
      processSteps,
      water,
      temperature,
      brewTime,
      favorite: Boolean(favorite)
    };

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', ensureGuestUser, (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, ratio, dose, photo, process, processSteps, water, temperature, brewTime, favorite } = req.body;
    
    const stmt = db.prepare(`
      UPDATE recipes 
      SET name = ?, ratio = ?, dose = ?, photo = ?, process = ?, process_steps = ?,
          grind_size = ?, water = ?, yield = ?, temperature = ?, brew_time = ?, favorite = ?
      WHERE id = ? AND guest_id = ?
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
      favorite ? 1 : 0,
      id,
      req.guestId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', ensureGuestUser, (req: any, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM recipes WHERE id = ? AND guest_id = ?');
    const result = stmt.run(id, req.guestId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Toggle favorite
router.post('/:id/favorite', ensureGuestUser, (req: any, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE recipes 
      SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END
      WHERE id = ? AND guest_id = ?
    `);
    
    const result = stmt.run(id, req.guestId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

export default router;