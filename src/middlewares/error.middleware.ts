import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    console.error('Prisma Known Error:', {
      code: err.code,
      message: err.message,
      meta: err.meta,
    });
    
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'A record with this value already exists',
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
        },
      });
      return;
    }
    
    // Handle missing table/relation errors (common after failed migrations)
    if (err.code === 'P2010' || err.code === 'P1001' || err.message.includes('does not exist')) {
      console.error('Database table/relation may not exist. Check if migrations ran successfully.');
      res.status(500).json({
        success: false,
        error: {
          message: 'Database configuration error. Please check migrations.',
          ...(process.env.NODE_ENV === 'development' && { 
            details: err.message,
            code: err.code,
          }),
        },
      });
      return;
    }
  }

  if (err instanceof PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid data provided',
      },
    });
    return;
  }

  // Log the full error for debugging
  console.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    ...(err instanceof Error && { cause: (err as any).cause }),
  });
  
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        name: err.name,
      }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
};

