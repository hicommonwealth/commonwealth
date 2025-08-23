import { z } from 'zod';
import { AuthContext } from '../context';
import { MCPServer } from '../entities';

export const GetCommunityMCPServers = {
  input: z.object({
    community_id: z.string(),
    private_only: z.boolean().optional(),
  }),
  output: z.array(MCPServer),
  context: AuthContext,
};
