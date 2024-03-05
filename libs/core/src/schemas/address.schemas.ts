import z from 'zod';

// TODO: move attributes from models
export const Address = z.object({
  address: z.string(),
});
