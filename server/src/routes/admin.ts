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
             water, temperature, brew_time, brewing_method, created_at, updated_at
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
        brewingMethod: template.brewing_method,
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
      water, temperature, brewTime, brewingMethod
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO recipe_templates 
      (name, ratio, dose, photo, process, process_steps, grind_size, water, yield, 
       temperature, brew_time, grinder_model, brewer_model, brewing_method, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      brewingMethod || null
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
      water, temperature, brewTime, brewingMethod
    } = req.body;

    const stmt = db.prepare(`
      UPDATE recipe_templates 
      SET name = ?, ratio = ?, dose = ?, photo = ?, process = ?, process_steps = ?,
          grind_size = ?, water = ?, yield = ?, temperature = ?, brew_time = ?, 
          grinder_model = ?, brewer_model = ?, brewing_method = ?, updated_at = CURRENT_TIMESTAMP
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
      brewingMethod || null,
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

// Get shared recipes pending approval
router.get('/shared-recipes', adminAuth, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT r.id, r.guest_id, r.name, r.ratio, r.dose, r.photo, r.process, r.process_steps,
             r.water, r.temperature, r.brew_time, r.brewing_method, r.created_at
      FROM recipes r
      WHERE r.share_to_community = 1
      ORDER BY r.created_at DESC
    `);

    const sharedRecipes = stmt.all().map((recipe: any) => ({
      id: recipe.id.toString(),
      guestId: recipe.guest_id,
      name: recipe.name,
      ratio: recipe.ratio,
      dose: recipe.dose,
      photo: recipe.photo,
      process: recipe.process,
      processSteps: recipe.process_steps ? JSON.parse(recipe.process_steps) : undefined,
      water: recipe.water,
      temperature: recipe.temperature,
      brewTime: recipe.brew_time,
      brewingMethod: recipe.brewing_method,
      createdAt: recipe.created_at
    }));

    res.json(sharedRecipes);
  } catch (error) {
    console.error('Error fetching shared recipes:', error);
    res.status(500).json({ error: 'Failed to fetch shared recipes' });
  }
});

// Approve shared recipe and convert to template
router.post('/shared-recipes/:id/approve', adminAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Get the recipe
    const recipe = db.prepare(`
      SELECT * FROM recipes WHERE id = ? AND share_to_community = 1
    `).get(id) as any;

    if (!recipe) {
      return res.status(404).json({ error: 'Shared recipe not found' });
    }

    // Create template from recipe
    const insertStmt = db.prepare(`
      INSERT INTO recipe_templates (name, ratio, dose, photo, process, process_steps,
                                   water, temperature, brew_time, brewing_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      recipe.name,
      recipe.ratio,
      recipe.dose,
      recipe.photo,
      recipe.process,
      recipe.process_steps,
      recipe.water,
      recipe.temperature,
      recipe.brew_time,
      recipe.brewing_method
    );

    // Unmark the recipe as shared (it's now approved)
    db.prepare(`
      UPDATE recipes SET share_to_community = 0 WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      templateId: result.lastInsertRowid.toString()
    });
  } catch (error) {
    console.error('Error approving shared recipe:', error);
    res.status(500).json({ error: 'Failed to approve shared recipe' });
  }
});

// Reject shared recipe
router.post('/shared-recipes/:id/reject', adminAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Unmark the recipe as shared
    const result = db.prepare(`
      UPDATE recipes SET share_to_community = 0 WHERE id = ? AND share_to_community = 1
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shared recipe not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting shared recipe:', error);
    res.status(500).json({ error: 'Failed to reject shared recipe' });
  }
});

// Get guest users grouped by date with hourly breakdown
router.get('/guest-users', adminAuth, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT guest_id, created_at,
             DATE(created_at) as registration_date,
             strftime('%H', created_at) as registration_hour
      FROM guest_users
      ORDER BY created_at DESC
    `).all() as any[];

    // Overall hourly distribution (all dates combined)
    const overallHourly: number[] = new Array(24).fill(0);

    // Group by date with hourly breakdown
    const byDate: Record<string, { date: string; count: number; hourly: number[] }> = {};

    users.forEach((user: any) => {
      const date = user.registration_date;
      const hour = parseInt(user.registration_hour, 10);

      // Add to overall hourly
      overallHourly[hour]++;

      // Add to per-date hourly
      if (!byDate[date]) {
        byDate[date] = { date, count: 0, hourly: new Array(24).fill(0) };
      }
      byDate[date].count++;
      byDate[date].hourly[hour]++;
    });

    // Convert to array sorted by date desc
    const dateGroups = Object.values(byDate).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    res.json({
      totalUsers: users.length,
      overallHourly,
      byDate: dateGroups
    });
  } catch (error) {
    console.error('Error fetching guest users:', error);
    res.status(500).json({ error: 'Failed to fetch guest users' });
  }
});

// Get all user recipes organized by user
router.get('/user-recipes', adminAuth, (req, res) => {
  try {
    const recipes = db.prepare(`
      SELECT r.id, r.guest_id, r.name, r.ratio, r.dose, r.water, 
             r.temperature, r.brew_time, r.created_at,
             g.created_at as user_created_at
      FROM recipes r
      LEFT JOIN guest_users g ON r.guest_id = g.guest_id
      ORDER BY r.created_at DESC
    `).all() as any[];

    // Group by user
    const grouped: Record<string, {
      guestId: string;
      userCreatedAt: string;
      recipeCount: number;
      latestRecipeDate: string;
      recipes: any[]
    }> = {};

    recipes.forEach((recipe: any) => {
      const guestId = recipe.guest_id;
      if (!grouped[guestId]) {
        grouped[guestId] = {
          guestId,
          userCreatedAt: recipe.user_created_at,
          recipeCount: 0,
          latestRecipeDate: recipe.created_at,
          recipes: []
        };
      }
      grouped[guestId].recipeCount++;
      grouped[guestId].recipes.push({
        id: recipe.id.toString(),
        name: recipe.name,
        ratio: recipe.ratio,
        dose: recipe.dose,
        water: recipe.water,
        temperature: recipe.temperature,
        brewTime: recipe.brew_time,
        createdAt: recipe.created_at
      });
    });

    // Convert to array sorted by latest recipe date desc
    const result = Object.values(grouped).sort((a, b) =>
      b.latestRecipeDate.localeCompare(a.latestRecipeDate)
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ error: 'Failed to fetch user recipes' });
  }
});

// Get popular recipes by start count
router.get('/popular-recipes', adminAuth, (req, res) => {
  try {
    const popular = db.prepare(`
      SELECT recipe_name, recipe_type, recipe_id, template_id,
             COUNT(*) as start_count
      FROM brew_sessions
      GROUP BY recipe_name, recipe_type, recipe_id, template_id
      ORDER BY start_count DESC
      LIMIT 50
    `).all() as any[];

    const result = popular.map((item: any) => ({
      recipeName: item.recipe_name,
      recipeType: item.recipe_type,
      recipeId: item.recipe_id?.toString() || null,
      templateId: item.template_id?.toString() || null,
      startCount: item.start_count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching popular recipes:', error);
    res.status(500).json({ error: 'Failed to fetch popular recipes' });
  }
});

export default router;