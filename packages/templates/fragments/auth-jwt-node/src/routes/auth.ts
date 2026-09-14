import { Router } from 'express';
import { generateToken, hashPassword, comparePassword } from '../auth/jwt.js';
import { authenticateJwt, type AuthenticatedRequest } from '../auth/middleware.js';

export const authRouter = Router();

// In-memory demo user store for scaffolding
const users = new Map<string, { id: string; email: string; passwordHash: string }>();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (users.has(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const passwordHash = await hashPassword(password);
  const userId = `user_${Date.now()}`;
  users.set(email, { id: userId, email, passwordHash });

  const token = generateToken({ userId, email });
  res.status(201).json({ token, user: { id: userId, email } });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.get(email);
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken({ userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.get('/me', authenticateJwt, (req, res) => {
  res.json({ user: (req as AuthenticatedRequest).user });
});

