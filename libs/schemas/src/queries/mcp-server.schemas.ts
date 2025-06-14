import { z } from 'zod';
import { MCPServer } from '../entities';

export const GetAllMCPServers = {
  input: z.object({}),
  output: z.array(MCPServer),
  context: z.object({}),
};
