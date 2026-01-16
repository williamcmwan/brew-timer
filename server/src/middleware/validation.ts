import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Recipe validation schema
export const recipeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  ratio: z.string().regex(/^\d+:\d+$/, 'Invalid ratio format (use X:Y)'),
  dose: z.number().min(0, 'Dose must be positive').max(1000, 'Dose too large'),
  water: z.number().min(0, 'Water must be positive').max(10000, 'Water amount too large'),
  temperature: z.number().min(0, 'Temperature must be positive').max(100, 'Temperature too high'),
  brewTime: z.string().regex(/^\d+:\d+$/, 'Invalid brew time format (use MM:SS)'),
  process: z.string().max(5000, 'Process description too long').optional(),
  photo: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  processSteps: z.array(z.object({
    description: z.string().max(200),
    waterAmount: z.number().min(0).max(10000),
    duration: z.number().min(0).max(3600),
    flowRate: z.number().min(0).max(100).optional(),
  })).optional(),
  favorite: z.boolean().optional(),
  shareToCommunity: z.boolean().optional(),
  brewingMethod: z.string().max(50).optional(),
});

// Template validation schema (similar to recipe but without user-specific fields)
export const templateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  ratio: z.string().regex(/^\d+:\d+$/),
  dose: z.number().min(0).max(1000),
  water: z.number().min(0).max(10000),
  temperature: z.number().min(0).max(100),
  brewTime: z.string().regex(/^\d+:\d+$/),
  process: z.string().max(5000).optional(),
  photo: z.string().url().optional().or(z.literal('')),
  processSteps: z.array(z.object({
    description: z.string().max(200),
    waterAmount: z.number().min(0).max(10000),
    duration: z.number().min(0).max(3600),
    flowRate: z.number().min(0).max(100).optional(),
  })).optional(),
  brewingMethod: z.string().max(50).optional(),
});

// Guest ID validation
export const guestIdSchema = z.string()
  .regex(/^guest-[a-f0-9-]+$/, 'Invalid guest ID format')
  .min(10)
  .max(100);

// Admin key validation (basic format check)
export const adminKeySchema = z.string()
  .min(8, 'Admin key too short')
  .max(200, 'Admin key too long');

// Validation middleware factory
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map((e: z.ZodIssue) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

// Validate guest ID from header
export function validateGuestId(req: any, res: Response, next: NextFunction) {
  const guestId = req.headers['x-guest-id'];
  
  if (!guestId) {
    return res.status(400).json({ error: 'Guest ID required' });
  }
  
  try {
    guestIdSchema.parse(guestId);
    req.guestId = guestId;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid guest ID format' });
  }
}

// Sanitize file upload
export function validateFileUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 2MB
  
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ 
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' 
    });
  }
  
  if (req.file.size > maxSize) {
    return res.status(400).json({ 
      error: 'File too large. Maximum size is 2MB' 
    });
  }
  
  next();
}
