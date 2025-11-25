import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const brewers = db.prepare(`
    SELECT id, model, photo, type FROM brewers WHERE user_id = ?
  `).all(userId) as any[];
  
  res.json(brewers.map(b => ({ ...b, id: String(b.id) })));
});

router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { model, photo, type } = req.body;
  const result = db.prepare(`
    INSERT INTO brewers (user_id, model, photo, type) VALUES (?, ?, ?, ?)
  `).run(userId, model, photo, type);
  
  res.json({ id: String(result.lastInsertRowid), model, photo, type });
});

router.put('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const { model, photo, type } = req.body;
  
  db.prepare(`
    UPDATE brewers SET model = ?, photo = ?, type = ? WHERE id = ? AND user_id = ?
  `).run(model, photo, type, id, userId);
  
  res.json({ id, model, photo, type });
});

router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  db.prepare('DELETE FROM brewers WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

export default router;
