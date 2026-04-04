import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const DEV_JWT_SECRET = 'schofy-dev-secret';

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  return DEV_JWT_SECRET;
}

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
