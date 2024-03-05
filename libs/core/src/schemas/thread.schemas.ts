import z from 'zod';
import { Address } from './address.schemas';

// TODO: move attributes from models
export const Thread = z.object({
  Address: Address.optional(),
});
