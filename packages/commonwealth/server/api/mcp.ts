import { logger } from '@hicommonwealth/core';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { z, ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  api as externalApi,
  trpcRouter as externalTrpcRouter,
} from './external-router';
import { apiKeyAuthMiddleware } from './external-router-middleware';

const log = logger(import.meta);

type CommonMCPTool = {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  fn: (token: string | null, input: unknown) => Promise<unknown>;
};

// map external trpc router procedures to MCP tools
export const buildMCPTools = (): Array<CommonMCPTool> => {
  const procedures = Object.keys(externalApi) as Array<
    keyof typeof externalApi
  >;
  const tools = procedures.map((key) => {
    const procedure = externalApi[key];
    const inputSchema = procedure._def.inputs[0] as ZodSchema;
    if (!inputSchema) {
      throw new Error(`No input schema for ${key}`);
    }
    return {
      name: key,
      description: inputSchema._def.description || '',
      inputSchema,
      fn: async (token: string | null, input: unknown) => {
        const [address, apiKey] = token?.split(':') || [];

        // build request and response objects to pass to the middleware
        const req = {
          headers: {
            address,
            'x-api-key': apiKey,
          },
          path: `/${key}`,
        } as any;

        const res = {} as any;

        // execute api key middleware
        let err: any;
        await apiKeyAuthMiddleware(req, res, (error?: any) => {
          if (error) {
            err = error;
          }
        });
        if (err) {
          throw err;
        }

        // trigger trcp procedure pipeline
        const trpcCaller = externalTrpcRouter.createCaller({
          req,
          res,
          actor: {
            user: req.user,
            address: req.headers['address'] as string,
          },
        });

        return await trpcCaller[key](input as any);
      },
    };
  });
  return tools;
};

const createMCPServer = (tools: CommonMCPTool[]): Server => {
  const toolsMap = tools.reduce(
    (acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    },
    {} as Record<string, CommonMCPTool>,
  );

  const mcpServer = new Server(
    {
      name: 'Common MCP Server',
      version: '0.0.1',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: zodToJsonSchema(tool.inputSchema),
      })),
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;

    if (!(name in toolsMap)) {
      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const validatedArgs = toolsMap[name].inputSchema.parse(args);
      const result = await toolsMap[name].fn(
        extra?.authInfo?.token || null,
        validatedArgs,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      log.error(`Error executing tool ${name}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [],
    };
  });

  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [],
    };
  });

  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  });

  return mcpServer;
};

export function buildMCPRouter() {
  const tools = buildMCPTools();

  log.info(`Initializing MCP server with ${tools.length} tools`);

  const mcpServer = createMCPServer(tools);

  const router = express.Router();

  // allow all origins
  router.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Authorization'],
    }),
  );

  // handle post requests
  router.post('/', async (req: Request, res: Response) => {
    try {
      const authHeader =
        req.headers['authorization'] || req.headers['Authorization'];
      const authToken = authHeader?.toString().split(' ')[1];
      if (!authToken) {
        throw new Error('No authorization token provided');
      }
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        transport.close();
      });
      await mcpServer.connect(transport);

      (req as IncomingMessage & { auth?: { token: string } }).auth = {
        token: authToken,
      };
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      log.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // handle unsupported methods
  router.get('/', async (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    });
  });

  // handle delete requests
  router.delete('/', async (req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    });
  });

  return router;
}

const PATH = '/mcp';
const router = buildMCPRouter();

export { PATH, router };
