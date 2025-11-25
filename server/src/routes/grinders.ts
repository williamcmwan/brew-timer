import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const grinders = db.prepare(`
    SELECT id, model, photo, burr_type as burrType, ideal_for as idealFor 
    FROM grinders WHERE user_id = ?
  `).all(userId) as any[];
  
  res.json(grinders.map(g => ({ ...g, id: String(g.id) })));
});

router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { model, photo, burrType, idealFor } = req.body;
  const result = db.prepare(`
    INSERT INTO grinders (user_id, model, photo, burr_type, ideal_for) 
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, model, photo, burrType, idealFor);
  
  res.json({ id: String(result.lastInsertRowid), model, photo, burrType, idealFor });
});

router.put('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const { model, photo, burrType, idealFor } = req.body;
  
  db.prepare(`
    UPDATE grinders SET model = ?, photo = ?, burr_type = ?, ideal_for = ?
    WHERE id = ? AND user_id = ?
  `).run(model, photo, burrType, idealFor, id, userId);
  
  res.json({ id, model, photo, burrType, idealFor });
});

router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  db.prepare('DELETE FROM grinders WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

export default router;
