import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

interface TemplateRow {
  id: number;
  name: string;
  fields: string;
}

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const templates = db.prepare(`
    SELECT id, name, fields FROM brew_templates WHERE user_id = ?
  `).all(userId) as TemplateRow[];
  
  const result = templates.map(t => ({
    id: String(t.id),
    name: t.name,
    fields: JSON.parse(t.fields)
  }));
  
  res.json(result);
});

router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { name, fields } = req.body;
  
  const result = db.prepare(`
    INSERT INTO brew_templates (user_id, name, fields) VALUES (?, ?, ?)
  `).run(userId, name, JSON.stringify(fields));
  
  res.json({ id: String(result.lastInsertRowid), name, fields });
});

router.put('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { id } = req.params;
  const { name, fields } = req.body;
  
  db.prepare(`
    UPDATE brew_templates SET name = ?, fields = ? WHERE id = ? AND user_id = ?
  `).run(name, JSON.stringify(fields), id, userId);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  db.prepare('DELETE FROM brew_templates WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

export default router;
