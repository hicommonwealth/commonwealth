import { Actor, logger } from '@hicommonwealth/core';
import { config, models } from '@hicommonwealth/model';
import { User } from '@hicommonwealth/schemas';
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
import { Op } from 'sequelize';
import { toJSONSchema, z, ZodType } from 'zod/v4';
import {
  api as externalApi,
  trpcRouter as externalTrpcRouter,
} from './external-router';
import { apiKeyAuthMiddleware } from './external-router-middleware';

const log = logger(import.meta);

type CommonMCPTool<T extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  inputSchema: T;
  fn: (token: string | null, input: z.infer<T>) => Promise<unknown>;
};

async function checkBypass(req: Request) {
  const address = req.headers['address'] as string;
  const apiKey = req.headers['x-api-key'] as string;

  const shouldBypass =
    config.MCP.MCP_KEY_BYPASS?.length &&
    `${address}:${apiKey}` === config.MCP.MCP_KEY_BYPASS;

  // If the bypass key doesn't match, we should use normal API key auth
  if (!shouldBypass) {
    return false;
  }

  // If bypass key matches but no address provided, we can't proceed
  if (!address) {
    throw new Error('Address header required for MCP bypass');
  }

  // Look up the address and set the user
  const addr = await models.Address.findOne({
    where: {
      address: address,
      verified: { [Op.ne]: null },
    },
    include: [
      {
        model: models.User,
        required: true,
      },
    ],
  });
  if (!addr?.User?.id) {
    throw new Error(`No verified user found for address: ${address}`);
  }

  req.address = addr;
  const user = addr.User;
  // Remove ApiKey from user object like the middleware does
  delete user.ApiKey;
  req.user = models.User.build(user as z.infer<typeof User>);
  return true;
}

// map external trpc router procedures to MCP tools
export const buildMCPTools = (): Array<CommonMCPTool> => {
  const procedures = Object.keys(externalApi) as Array<
    keyof typeof externalApi
  >;
  const tools = procedures.map((key) => {
    const procedure = externalApi[key];
    const inputSchema = procedure._def.inputs[0] as ZodType;
    if (!inputSchema) {
      throw new Error(`No input schema for ${key}`);
    }
    return {
      name: key,
      description: inputSchema.description || '',
      inputSchema,
      fn: async (token: string | null, input: z.infer<typeof inputSchema>) => {
        const [address, apiKey] = token?.split(':') || [];

        // build request and response objects to pass to the middleware
        const req = {
          headers: {
            address,
            'x-api-key': apiKey,
          },
          path: `/${key}`,
        } as unknown as Request;

        const res = {} as Response;

        // execute api key middleware
        const shouldBypass = await checkBypass(req);
        if (!shouldBypass) {
          let err: Error | null = null;
          await apiKeyAuthMiddleware(req, res, (error?: unknown) => {
            if (error) {
              err = error as Error;
            }
          });
          if (err) {
            throw err;
          }
        }

        // Ensure user is set after authentication
        if (!req.user) {
          throw new Error('User not authenticated');
        }

        // trigger trcp procedure pipeline
        const trpcCaller = externalTrpcRouter.createCaller({
          req,
          res,
          actor: {
            user: req.user as Actor['user'],
            address: req.headers['address'] as string,
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (trpcCaller as any)[key](input);
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

  mcpServer.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: toJSONSchema(tool.inputSchema),
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

  mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, () => {
    return {
      resourceTemplates: [],
    };
  });

  mcpServer.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: [],
    };
  });

  mcpServer.setRequestHandler(ReadResourceRequestSchema, (request) => {
    throw new Error(`Unknown resource: ${request.params.uri}`);
  });

  return mcpServer;
};

const unsupportedMethodHandler = (req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  });
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

  // eslint-disable-next-line
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

      // eslint-disable-next-line
      res.on('close', async () => {
        await transport.close();
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
  router.get('/', unsupportedMethodHandler);
  router.put('/', unsupportedMethodHandler);
  router.delete('/', unsupportedMethodHandler);

  return router;
}

const PATH = '/mcp';
const router = buildMCPRouter();

export { PATH, router };
