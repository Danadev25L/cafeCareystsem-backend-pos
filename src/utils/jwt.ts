import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables before accessing them
// Use { quiet: true } to suppress dotenv logs in production
// Try multiple paths to find .env file (works in both dev and production/Docker)
const envPath = resolve(process.cwd(), '.env');
dotenv.config({ path: envPath, quiet: true });

import jwt from 'jsonwebtoken';
import { Role } from '../types';

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role | string; // Accept both enum and string for compatibility
}

// Validate JWT secrets are set and meet minimum security requirements
const validateJWTSecret = (secret: string | undefined, name: string): string => {
  if (!secret) {
    throw new Error(`JWT ${name} is not set in environment variables`);
  }
  if (secret.length < 32) {
    console.warn(`Warning: JWT ${name} is less than 32 characters. Consider using a longer secret for better security.`);
  }
  if (secret === 'your-super-secret-jwt-key-change-in-production' || 
      secret === 'your-super-secret-refresh-key-change-in-production') {
    throw new Error(`JWT ${name} must be changed from default value in production`);
  }
  return secret;
};

const JWT_SECRET = process.env.JWT_SECRET 
  ? validateJWTSecret(process.env.JWT_SECRET, 'JWT_SECRET')
  : (process.env.NODE_ENV === 'production' 
      ? (() => { 
          throw new Error(
            'JWT_SECRET must be set in production. ' +
            'Please set it as an environment variable or in your .env file. ' +
            'Current NODE_ENV: ' + process.env.NODE_ENV
          ); 
        })()
      : 'cafecare-dev-secret-key-min-32-characters-for-development-only');

// Support both JWT_REFRESH_SECRET (correct) and JWT_REFRESH_SECRE (typo) for backward compatibility
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
  ? validateJWTSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')
  : process.env.JWT_REFRESH_SECRE
  ? (() => {
      console.warn('Warning: JWT_REFRESH_SECRE is deprecated. Please rename to JWT_REFRESH_SECRET in your environment variables.');
      return validateJWTSecret(process.env.JWT_REFRESH_SECRE, 'JWT_REFRESH_SECRET');
    })()
  : (process.env.NODE_ENV === 'production'
      ? (() => { 
          throw new Error(
            'JWT_REFRESH_SECRET must be set in production. ' +
            'Please set it as an environment variable or in your .env file. ' +
            'Current NODE_ENV: ' + process.env.NODE_ENV
          ); 
        })()
      : 'cafecare-dev-refresh-secret-key-min-32-characters-for-development-only');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'cafecare-api',
    audience: 'cafecare-client',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'cafecare-api',
    audience: 'cafecare-client',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'cafecare-api',
      audience: 'cafecare-client',
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'cafecare-api',
      audience: 'cafecare-client',
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

