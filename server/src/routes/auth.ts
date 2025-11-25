import { Router } from 'express';
import { db } from '../db/schema.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT id, email, name FROM users WHERE LOWER(email) = LOWER(?) AND password = ?')
    .get(email, password) as { id: number; email: string; name: string } | undefined;
  
  if (user) {
    res.json({ id: user.id, email: user.email, name: user.name });
  } else {
    const emailExists = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email);
    if (emailExists) {
      res.status(401).json({ error: 'Incorrect password' });
    } else {
      res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
    }
  }
});

router.post('/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
    .get(email);
  
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }
  
  const result = db.prepare('INSERT INTO users (email, password, name) VALUES (LOWER(?), ?, ?)')
    .run(email, password, name);
  
  res.json({ id: result.lastInsertRowid, email: email.toLowerCase(), name });
});

export default router;
