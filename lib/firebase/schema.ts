import { z } from 'zod';

export const TextOverlaySchema = z.object({
  content: z.string().max(80),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  color: z.string(),
  position: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  alignment: z.enum(['left', 'center', 'right']),
  weight: z.number(),
});

export const RecipeSchema = z.object({
  aspectRatio: z.string(),
  frameId: z.string(),
  backgroundId: z.string(),
  backgroundCustomUrl: z.string().optional(),
  styleId: z.string(),
  textOverlay: TextOverlaySchema.partial().optional(),
  cropStrategy: z.enum(['center', 'smart', 'manual']).default('center'),
});

export const TemplateSchema = z.object({
  id: z.string(),
  ownerUid: z.string(),
  name: z.string(),
  thumbnailUrl: z.string(),
  createdAt: z.unknown(), // Firestore Timestamp
  lastUsedAt: z.unknown(),
  useCount: z.number().default(0),
  recipe: RecipeSchema,
});

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().optional(),
  credits: z.number().default(0),
  plan: z.enum(['free', 'personal', 'pro']).default('free'),
  isOwner: z.boolean().default(false),
  createdAt: z.unknown(),
  lastLoginAt: z.unknown(),
});

export const GenerationSchema = z.object({
  id: z.string(),
  inputImagePath: z.string(),
  outputImagePath: z.string(),
  prompt: z.string(),
  model: z.literal('gemini-2.5-flash-image'),
  cost: z.number().default(1),
  presets: z.object({
    frameId: z.string(),
    backgroundId: z.string(),
    styleId: z.string(),
  }),
  templateId: z.string().optional(),
  createdAt: z.unknown(),
  status: z.enum(['success', 'failed']),
  error: z.string().optional(),
});

export type TextOverlay = z.infer<typeof TextOverlaySchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type User = z.infer<typeof UserSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
