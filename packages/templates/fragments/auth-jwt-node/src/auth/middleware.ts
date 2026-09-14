import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyToken, type JwtPayload } from './jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJwt: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

