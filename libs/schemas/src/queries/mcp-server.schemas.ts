import { z } from 'zod';
import { MCPServer } from '../entities';

export const GetAllMCPServers = {
  input: z.void(),
  output: z.array(MCPServer),
};
