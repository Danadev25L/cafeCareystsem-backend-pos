import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../utils/db';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createTableValidation = [
  body('number')
    .isInt({ min: 1 })
    .withMessage('Table number must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

export const updateTableValidation = [
  body('number')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Table number must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

export const getAllTables = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          where: {
            status: {
              in: ['PENDING', 'PREPARING', 'READY'],
            },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // Transform tables to include hasActiveOrder flag
    const tablesWithStatus = tables.map((table: { id: number; number: number; name: string | null; description: string | null; createdAt: Date; updatedAt: Date; orders: Array<{ status: string; id: number }> }) => ({
      id: table.id,
      number: table.number,
      name: table.name,
      description: table.description,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      hasActiveOrder: table.orders.length > 0,
      activeOrderStatus: table.orders.length > 0 ? table.orders[0].status : null,
      activeOrderId: table.orders.length > 0 ? table.orders[0].id : null,
    }));

    res.json({
      success: true,
      data: { tables: tablesWithStatus },
    });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const tableId = parseInt(id, 10);

    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!table) {
      throw new NotFoundError('Table not found');
    }

    res.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { number, name, description } = req.body;

    const existingTable = await prisma.table.findFirst({
      where: { number },
    });

    if (existingTable) {
      throw new ConflictError('Table with this number already exists');
    }

    const table = await prisma.table.create({
      data: {
        number,
        name: name || null,
        description: description || null,
      },
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const tableId = parseInt(id, 10);
    const { number, name, description } = req.body;

    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existingTable) {
      throw new NotFoundError('Table not found');
    }

    if (number && number !== existingTable.number) {
      const duplicateTable = await prisma.table.findFirst({
        where: { number, id: { not: tableId } },
      });

      if (duplicateTable) {
        throw new ConflictError('Table with this number already exists');
      }
    }

    const updateData: {
      number?: number;
      name?: string | null;
      description?: string | null;
    } = {};

    if (number !== undefined) updateData.number = number;
    if (name !== undefined) updateData.name = name || null;
    if (description !== undefined) updateData.description = description || null;

    const table = await prisma.table.update({
      where: { id: tableId },
      data: updateData,
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const tableId = parseInt(id, 10);

    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existingTable) {
      throw new NotFoundError('Table not found');
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

