import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain (after all routes).
 *
 * Catches any error passed via next(err) from controllers/services and
 * returns a structured JSON error response.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = config.nodeEnv !== 'production';

  console.error('[ErrorHandler]', err.message);
  if (isDev) {
    console.error(err.stack);
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isDev ? err.message : 'Terjadi kesalahan internal. Coba beberapa saat lagi.',
    ...(isDev ? { stack: err.stack } : {}),
  });
};

/**
 * 404 handler for unknown routes.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint tidak ditemukan.',
  });
};
