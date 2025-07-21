import { z } from 'zod';
import { AuthContext } from '../context';

export const CreateKlavisMCPInstance = {
  input: z.object({
    serverType: z
      .enum(['Google Sheets'])
      .describe('The type of MCP server to create'),
  }),
  output: z.object({
    serverUrl: z
      .string()
      .describe('The URL of the created MCP server instance'),
    instanceId: z
      .string()
      .describe('The unique identifier for the created instance'),
    oauthUrl: z.string().describe('The OAuth URL for user authentication'),
  }),
  context: AuthContext,
};
