import { z } from 'zod/v4';
import { AuthContext } from '../context';
import { Tags } from '../entities';
import { PG_INT } from '../utils';

export const CreateTag = {
  input: z.object({
    name: z.string().describe('The name of the tag'),
  }),
  output: Tags,
  context: AuthContext,
};

export const UpdateTag = {
  input: z.object({
    id: PG_INT.describe('The id of the tag to update'),
    name: z.string().describe('The new name of the tag'),
  }),
  output: Tags,
  context: AuthContext,
};

export const DeleteTag = {
  input: z.object({
    id: PG_INT.describe('The id of the tag to delete'),
  }),
  output: z.boolean().describe('Whether the tag was deleted'),
  context: AuthContext,
};
