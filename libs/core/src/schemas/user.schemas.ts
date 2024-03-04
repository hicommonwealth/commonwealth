import z from 'zod';
import { MAX_SCHEMA_INT, MIN_SCHEMA_INT } from '../constants';

export const User = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  email: z.string().max(255).email().optional(),
  isAdmin: z.boolean().optional(),
  disableRichText: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  selected_community_id: z.string().max(255).optional(),
  emailNotificationInterval: z.enum(['week', 'never']).optional(),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export const Profile = z.object({
  id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  user_id: z.number().int().min(MIN_SCHEMA_INT).max(MAX_SCHEMA_INT),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  profile_name: z.string().max(255).optional(),
  email: z.string().max(255).optional(),
  website: z.string().max(255).optional(),
  bio: z.string().optional(),
  avatar_url: z.string().max(255).optional(),
  slug: z.string().max(255).optional(),
  socials: z.array(z.string()).optional(),
  background_image: z.any().optional(),
  bio_backup: z.string().optional(),
  profile_name_backup: z.string().max(255).optional(),
});
