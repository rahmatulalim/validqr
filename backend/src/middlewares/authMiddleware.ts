import { Request, Response, NextFunction } from 'express';

/**
 * JWT/API Key authentication middleware.
 * 
 * NOTE: Authentication is intentionally minimal for the HackNusa demo prototype.
 * In production, this would validate a signed JWT or API key.
 * 
 * For the demo, this middleware simply passes through all requests.
 * To enable basic API key protection, set API_KEY in .env and uncomment the check below.
 */
export const authMiddleware = (_req: Request, _res: Response, next: NextFunction): void => {
  // Demo mode: no auth enforcement
  // In production:
  // const apiKey = req.headers['x-api-key'];
  // if (!apiKey || apiKey !== config.apiKey) {
  //   _res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid API key' });
  //   return;
  // }
  next();
};
