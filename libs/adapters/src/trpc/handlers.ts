import {
  Events,
  INVALID_ACTOR_ERROR,
  INVALID_INPUT_ERROR,
  command as coreCommand,
  query as coreQuery,
  handleEvent,
  type CommandMetadata,
  type EventSchemas,
  type EventsHandlerMetadata,
  type QueryMetadata,
} from '@hicommonwealth/core';
import { TRPCError } from '@trpc/server';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { Tag, Track, buildproc, procedure } from './middleware';

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

/**
 * Builds tRPC command POST endpoint
 * @param factory command factory
 * @param tag command tag used for OpenAPI spec grouping
 * @param track analytics tracking metadata as tuple of [event, output mapper]
 * @returns tRPC mutation procedure
 */
export const command = <Input extends ZodSchema, Output extends ZodSchema>(
  factory: () => CommandMetadata<Input, Output>,
  tag: Tag,
  track?: Track<Output>,
) => {
  const md = factory();
  return buildproc('POST', factory.name, md, tag, track).mutation(
    async ({ ctx, input }) => {
      try {
        return await coreCommand(
          md,
          {
            actor: ctx.actor,
            payload: input!,
          },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    },
  );
};

/**
 * Builds tRPC query GET endpoint
 * @param factory query factory
 * @param tag query tag used for OpenAPI spec grouping
 * @returns tRPC query procedure
 */
export const query = <Input extends ZodSchema, Output extends ZodSchema>(
  factory: () => QueryMetadata<Input, Output>,
  tag: Tag,
) => {
  const md = factory();
  return buildproc('GET', factory.name, md, tag).query(
    async ({ ctx, input }) => {
      try {
        return await coreQuery(
          md,
          {
            actor: ctx.actor,
            payload: input!,
          },
          false,
        );
      } catch (error) {
        throw trpcerror(error);
      }
    },
  );
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
  return procedure
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
