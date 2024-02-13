import { z } from 'zod';

export const validationSchema = z.object({
  namespace: z.string().min(1, 'Namespace is required'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(9, 'Symbol should be maximum 9 characters'),
});
