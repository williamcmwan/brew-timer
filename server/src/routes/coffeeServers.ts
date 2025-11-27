import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const servers = db.prepare(`
    SELECT id, model, photo, max_volume, empty_weight FROM coffee_servers WHERE user_id = ?
  `).all(userId) as any[];
  
  res.json(servers.map(s => ({
    id: String(s.id),
    model: s.model,
    photo: s.photo,
    maxVolume: s.max_volume,
    emptyWeight: s.empty_weight,
  })));
});

router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { model, photo, maxVolume, emptyWeight } = req.body;
  const result = db.prepare(`
    INSERT INTO coffee_servers (user_id, model, photo, max_volume, empty_weight) VALUES (?, ?, ?, ?, ?)
  `).run(userId, model, photo, maxVolume, emptyWeight);
  
  res.json({ id: String(result.lastInsertRowid), model, photo, maxVolume, emptyWeight });
});

router.put('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const { model, photo, maxVolume, emptyWeight } = req.body;
  
  db.prepare(`
    UPDATE coffee_servers SET model = ?, photo = ?, max_volume = ?, empty_weight = ? WHERE id = ? AND user_id = ?
  `).run(model, photo, maxVolume, emptyWeight, id, userId);
  
  res.json({ id, model, photo, maxVolume, emptyWeight });
});

router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  db.prepare('DELETE FROM coffee_servers WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

export default router;
