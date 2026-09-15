import { Request, Response, NextFunction } from 'express';

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.cookies?.['session_id'] || req.headers['x-session-id'];
  if (!sessionId) {
    res.status(401).json({ error: 'Active session required' });
    return;
  }
  next();
}
