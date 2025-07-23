import { z } from 'zod';
import { AuthContext } from '../context';
import { MCPServer } from '../entities';

export const GetAllMCPServers = {
  input: z.void(),
  output: z.array(MCPServer),
};

export const GetPrivateCommunityMCPServers = {
  input: z.object({
    community_id: z.string(),
  }),
  output: z.array(MCPServer),
  context: AuthContext,
};
