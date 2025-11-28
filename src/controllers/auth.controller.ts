import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import { prisma } from '../utils/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError, ConflictError, NotFoundError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Role } from '../types';

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  // SECURITY: Remove role validation from public registration
  // All public registrations default to CASHIER role
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);

    // SECURITY: Only allow CASHIER role for public registration
    // ADMIN users must be created by existing admins only
    const userRole = role || Role.CASHIER;

    if (userRole === Role.ADMIN) {
      console.log('🚨 SECURITY: Attempted admin account creation via public registration:', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      throw new UnauthorizedError('Admin users can only be created by existing admins through admin panel');
    }

    if (userRole === Role.CAPTAIN) {
      console.log('🚨 SECURITY: Attempted captain account creation via public registration:', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      throw new UnauthorizedError('Captain users can only be created by admins');
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // express-validator's normalizeEmail() should have already normalized req.body.email
    // But we'll normalize it again to ensure consistency with how users are stored
    // Use the same normalization as express-validator (lowercase + trim)
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    // Log login attempt for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Login attempt:', { 
        emailFromBody: email,
        normalizedEmail,
        timestamp: new Date().toISOString() 
      });
    }

    // Try to find user with normalized email (this is how new users are stored)
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If not found, try the email as-is (for backward compatibility with old users)
    if (!user && email && email !== normalizedEmail) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ User not found with normalized email, trying original:', email);
      }
      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Login failed: User not found:', { 
          originalEmail: email, 
          normalizedEmail,
          searchedEmails: [normalizedEmail, email !== normalizedEmail ? email : null].filter(Boolean)
        });
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Login failed: Account deactivated:', { email: user.email });
      }
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Login failed: Invalid password for:', { 
          email: user.email,
          passwordProvided: !!password,
          passwordLength: password?.length 
        });
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Login successful:', { email, role: user.role });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new ValidationError('Refresh token is required');
    }

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(name && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hashedNewPassword = await bcrypt.hash(newPassword, bcryptRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

