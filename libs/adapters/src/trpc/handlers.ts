import {
  Events,
  INVALID_ACTOR_ERROR,
  INVALID_INPUT_ERROR,
  command as coreCommand,
  query as coreQuery,
  handleEvent,
  type CommandInput,
  type CommandMetadata,
  type EventSchemas,
  type EventsHandlerMetadata,
  type QueryMetadata,
  type User,
} from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import { Request } from 'express';
import { type OpenApiMeta } from 'trpc-swagger';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { OutputMiddleware, authenticate } from './middleware';

export interface Context {
  req: Request;
}

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();

const isSecure = (md: { secure?: boolean; auth: unknown[] }) =>
  md.secure !== false || md.auth.length > 0;

const trpcerror = (error: unknown): TRPCError => {
  if (error instanceof Error) {
    const { name, message, ...other } = error;
    switch (name) {
      case INVALID_INPUT_ERROR:
        return new TRPCError({ code: 'BAD_REQUEST', message, ...other });

      case INVALID_ACTOR_ERROR:
        return new TRPCError({ code: 'UNAUTHORIZED', message });

      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message,
          cause: error,
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
  Integration = 'Integration',
  Subscription = 'Subscription',
  LoadTest = 'LoadTest',
  Wallet = 'Wallet',
  Webhook = 'Webhook',
}

export const command = <Input extends CommandInput, Output extends ZodSchema>(
  factory: () => CommandMetadata<Input, Output>,
  tag: Tag,
  outputMiddleware?: OutputMiddleware<z.infer<Output>>,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'POST',
        path: `/${factory.name}/{id}`,
        tags: [tag],
        headers: [
          {
            in: 'header',
            name: 'address',
            required: true,
            schema: { type: 'string' },
          },
        ],
        protect: isSecure(md),
      },
    })
    .input(md.input)
    .output(md.output)
    .mutation(async ({ ctx, input }) => {
      // md.secure must explicitly be false if the route requires no authentication
      // if we provide any authorization method we force authentication as well
      if (isSecure(md)) await authenticate(ctx.req, md.authStrategy);
      try {
        const _ctx = {
          actor: {
            user: ctx.req.user as User,
            address: ctx.req.headers['address'] as string,
          },
          payload: input!,
        };
        const result = await coreCommand(md, _ctx, false);
        outputMiddleware && (await outputMiddleware(_ctx, result!));
        return result;
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

// TODO: add security options (API key, IP range, internal, etc)
export const event = <
  Input extends EventSchemas,
  Output extends ZodSchema | ZodUndefined = ZodUndefined,
>(
  factory: () => EventsHandlerMetadata<Input, Output>,
  tag: Tag.Integration,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'POST',
        path: `/${factory.name}`,
        tags: [tag],
      },
    })
    .input(z.object(md.inputs))
    .output(md.output ?? z.object({}).optional())
    .mutation(async ({ input }) => {
      try {
        const [[name, payload]] = Object.entries(input as object);
        return await handleEvent(md, { name: name as Events, payload }, false);
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

export const query = <Input extends ZodSchema, Output extends ZodSchema>(
  factory: () => QueryMetadata<Input, Output>,
  tag: Tag,
) => {
  const md = factory();
  return trpc.procedure
    .meta({
      openapi: {
        method: 'GET',
        path: `/${factory.name}`,
        tags: [tag],
        headers: [
          {
            in: 'header',
            name: 'address',
            required: false,
            schema: { type: 'string' },
          },
        ],
      },
      protect: isSecure(md),
    })
    .input(md.input)
    .output(md.output)
    .query(async ({ ctx, input }) => {
      // enable secure by default
      if (isSecure(md)) await authenticate(ctx.req, md.authStrategy);
      try {
        return await coreQuery(
          md,
          {
            actor: {
              user: ctx.req.user as User,
              address: ctx.req.headers['address'] as string,
            },
            payload: input!,
          },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    });
};

export const router = trpc.router;
