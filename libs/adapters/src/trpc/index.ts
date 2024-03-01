import * as core from '@hicommonwealth/core';
import {
  INVALID_ACTOR_ERROR,
  INVALID_INPUT_ERROR,
  type CommandMetadata,
  type EventSchemas,
  type EventsHandler,
  type QueryMetadata,
} from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import { Request } from 'express';
import passport from 'passport';
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
  type GenerateOpenApiDocumentOptions,
  type OpenApiMeta,
  type OpenApiRouter,
} from 'trpc-openapi';
import { ZodObject, z } from 'zod';

interface Context {
  req: Request;
}

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();

const authenticate = async (req: Request) => {
  try {
    await passport.authenticate('jwt', { session: false });
    if (!req.user) throw new Error('Not authenticated');
  } catch (error) {
    throw new TRPCError({
      message: error instanceof Error ? error.message : (error as string),
      code: 'UNAUTHORIZED',
    });
  }
};

const trpcerror = (error: unknown): TRPCError => {
  if (error instanceof Error) {
    const { name, message } = error;
    switch (name) {
      case INVALID_INPUT_ERROR:
        return new TRPCError({ code: 'BAD_REQUEST', message });

      case INVALID_ACTOR_ERROR:
        return new TRPCError({ code: 'UNAUTHORIZED', message });

      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
          cause: process.env.NODE_ENV !== 'production' ? error : undefined,
        });
    }
  }
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Oops, something went wrong!',
  });
};

export enum Tag {
  User = 'User',
  Community = 'Community',
  Thread = 'Thread',
  Comment = 'Comment',
  Reaction = 'Reaction',
  Query = 'Query',
  Policy = 'Policy',
  Projection = 'Projection',
  Integration = 'Integration',
}

export const command = <T, P extends ZodObject<any>>(
  factory: () => CommandMetadata<T, P>,
  tag: Tag,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'POST',
        path: `/${tag.toLowerCase()}/{id}/${factory.name}`,
        tags: [tag],
        protect: md.secure,
      },
    })
    .input(
      md.schema.extend({
        id: z.string(),
        address_id: z.string().optional(),
      }),
    )
    .output(z.object({}).optional()) // TODO: use output schemas
    .mutation(async ({ ctx, input }) => {
      if (md.secure) await authenticate(ctx.req);
      try {
        const { id, address_id, ...payload } = input;
        return await core.command(
          md,
          {
            id,
            actor: {
              user: ctx.req.user as core.User,
              address_id,
            },
            payload,
          },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

// TODO: add security options (API key, IP range, internal, etc)
export const event = <T, S extends EventSchemas>(
  factory: () => EventsHandler<T, S>,
  tag: Tag.Policy | Tag.Projection | Tag.Integration,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'POST',
        path: `/${tag.toLowerCase()}/${factory.name}`,
        tags: [tag],
      },
    })
    .input(z.object(md.schemas))
    .output(z.object({}).optional()) // TODO: use output schemas
    .mutation(async ({ input }) => {
      try {
        const [[name, payload]] = Object.entries(input as object);
        return await core.event(
          md,
          { name: name as core.events.Events, payload },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

export const query = <T, P extends ZodObject<any>>(
  factory: () => QueryMetadata<T, P>,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'GET',
        path: `/${Tag.Query.toLowerCase()}/${factory.name}`,
        tags: [Tag.Query],
      },
      protect: md.secure,
    })
    .input(md.schema.extend({ address_id: z.string().optional() }))
    .output(z.object({}).optional()) // TODO: use output schema
    .query(async ({ ctx, input }) => {
      if (md.secure) await authenticate(ctx.req);
      try {
        const { address_id, ...payload } = input;
        return await core.query(
          md,
          {
            actor: {
              user: ctx.req.user as core.User,
              address_id,
            },
            payload,
          },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

export const toExpress = (router: OpenApiRouter) =>
  createOpenApiExpressMiddleware({
    router,
    createContext: ({ req }) => ({ req }),
  });

export const toOpenApiDocument = (
  router: OpenApiRouter,
  opts: GenerateOpenApiDocumentOptions,
) => generateOpenApiDocument(router, { ...opts, tags: Object.keys(Tag) });

export const router = trpc.router;
