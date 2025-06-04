import { Actor, logger } from '@hicommonwealth/core';
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
import { z, ZodSchema } from 'zod';
import { api as externalApi, trpcRouter } from './external-router';

const log = logger(import.meta);

type CommonMCPTool = {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  fn: (actor: Actor, args: unknown) => Promise<unknown>;
};

// map external trpc router procedures to MCP tools
export const buildMCPTools = (): Array<CommonMCPTool> => {
  const procedures = Object.entries(externalApi);
  const tools = procedures.map(([key, procedure]) => {
    console.log(key, procedure);
    const inputSchema = procedure._def.inputs[0] as ZodSchema;
    if (!inputSchema) {
      throw new Error(`No input schema for ${key}`);
    }
    return {
      name: key,
      description: inputSchema._def.description,
      inputSchema: z.any(), // schema is validated at runtime
      fn: async (user: Actor, args: unknown) => {
        const trpcCaller = trpcRouter.createCaller({
          req: {
            user,
            headers: {},
          } as any,
          res: {} as any,
          actor: user,
        });
        const procedurePath = key.split('.');
        let currentCaller: any = trpcCaller;
        for (const segment of procedurePath) {
          currentCaller = currentCaller[segment];
          if (!currentCaller) {
            throw new Error(`Procedure ${key} not found`);
          }
        }
        return await currentCaller(args);
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
        tools: toolsMap,
      },
    },
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
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

    console.log('request', JSON.stringify(request, null, 2));

    try {
      const validatedArgs = toolsMap[name].inputSchema.parse(args);
      log.info(
        `Executing tool: ${name} with params: ${JSON.stringify(validatedArgs)}`,
      );
      const actor = {
        user: {
          id: -1,
          email: 'mcp@common.im',
          isAdmin: true,
        },
      };
      const result = await toolsMap[name].fn(actor, validatedArgs);
      console.log(result);
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

  log.info(`Adding ${tools.length} MCP Tools`);

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
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        transport.close();
      });
      await mcpServer.connect(transport);
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
