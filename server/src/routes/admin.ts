import { Router, Response } from 'express';
import { db } from '../db/schema.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Admin email constant
const ADMIN_EMAIL = 'admin@admin.com';

// Get admin user ID
function getAdminUserId(): number | null {
  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL) as { id: number } | undefined;
  return admin?.id || null;
}

// Get admin grinders
router.get('/grinders', (req: AuthRequest, res: Response) => {
  const adminId = getAdminUserId();
  if (!adminId) {
    return res.json([]);
  }
  
  const grinders = db.prepare(`
    SELECT id, model, photo, burr_type as burrType, ideal_for as idealFor 
    FROM grinders WHERE user_id = ?
  `).all(adminId) as any[];
  
  res.json(grinders.map(g => ({ ...g, id: String(g.id) })));
});

// Get admin brewers
router.get('/brewers', (req: AuthRequest, res: Response) => {
  const adminId = getAdminUserId();
  if (!adminId) {
    return res.json([]);
  }
  
  const brewers = db.prepare(`
    SELECT id, model, photo, type 
    FROM brewers WHERE user_id = ?
  `).all(adminId) as any[];
  
  res.json(brewers.map(b => ({ ...b, id: String(b.id) })));
});

// Get admin coffee servers
router.get('/coffee-servers', (req: AuthRequest, res: Response) => {
  const adminId = getAdminUserId();
  if (!adminId) {
    return res.json([]);
  }
  
  const servers = db.prepare(`
    SELECT id, model, photo, max_volume as maxVolume, empty_weight as emptyWeight 
    FROM coffee_servers WHERE user_id = ?
  `).all(adminId) as any[];
  
  res.json(servers.map(s => ({ ...s, id: String(s.id) })));
});

// Get admin recipes (without grinder/brewer IDs since those are user-specific)
router.get('/recipes', (req: AuthRequest, res: Response) => {
  const adminId = getAdminUserId();
  if (!adminId) {
    return res.json([]);
  }
  
  const recipes = db.prepare(`
    SELECT r.id, r.name, r.ratio, r.dose, r.photo, r.process, r.process_steps as processSteps,
           r.grind_size as grindSize, r.water, r.yield, r.temperature, r.brew_time as brewTime,
           g.model as grinderModel, b.model as brewerModel
    FROM recipes r
    LEFT JOIN grinders g ON r.grinder_id = g.id
    LEFT JOIN brewers b ON r.brewer_id = b.id
    WHERE r.user_id = ?
  `).all(adminId) as any[];
  
  res.json(recipes.map(r => ({
    ...r,
    id: String(r.id),
    processSteps: r.processSteps ? JSON.parse(r.processSteps) : [],
  })));
});

export default router;
