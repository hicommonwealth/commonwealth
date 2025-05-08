import { z } from 'zod';
import { AuthContext } from '../context';
import { Tags } from '../entities/tag.schemas';

export const GetTags = {
  input: z.object({}),
  output: z.array(Tags),
  context: AuthContext,
};
