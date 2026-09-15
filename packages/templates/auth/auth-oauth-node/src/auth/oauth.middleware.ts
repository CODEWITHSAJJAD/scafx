import { Request, Response, NextFunction } from 'express';

export function verifyOAuthToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid OAuth Bearer token' });
    return;
  }
  // Hook OAuth2 provider (Google / GitHub / Auth0 / Keycloak) validation here
  next();
}
