import { z } from 'zod';

export const CreateTodo = {
  input: z.object({ id: z.string() }),
  output: z.object({}),
};
