import z from 'zod';
import { Address } from './address.schemas';

// TODO: move attributes from models
export const Comment = z.object({
  Address: Address.optional(),
});
