import { MCPServer } from '@hicommonwealth/schemas';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

export type McpServer = z.infer<typeof MCPServer>;

const FETCH_MCP_SERVERS_STALE_TIME = 60 * 1000; // 1 minute

const fetchServers = async (): Promise<McpServer[]> => {
  const response = await fetch('/api/mcp-servers');
  if (!response.ok) {
    throw new Error('Failed to fetch MCP servers');
  }
  return response.json();
};

const useFetchMcpServersQuery = (enabled = true) =>
  useQuery({
    queryKey: ['mcp-servers'],
    queryFn: fetchServers,
    staleTime: FETCH_MCP_SERVERS_STALE_TIME,
    enabled,
  });

export default useFetchMcpServersQuery;
