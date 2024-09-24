import {
  Events,
  INVALID_ACTOR_ERROR,
  INVALID_INPUT_ERROR,
  command as coreCommand,
  query as coreQuery,
  handleEvent,
  type EventSchemas,
  type EventsHandlerMetadata,
  type Metadata,
} from '@hicommonwealth/core';
import { TRPCError } from '@trpc/server';
import { ZodSchema, ZodUndefined, z } from 'zod';
import { Commit, Tag, Track, buildproc, procedure } from './middleware';

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
          message: `[${name}] ${message}`,
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
 * @param track analytics tracking middleware as:
 * - tuple of `[event, output mapper]`
 * - or `(input,output) => Promise<[event, data]|undefined>`
 * @param commit output middleware (best effort), mainly used to commit actions to canvas
 * - `(input,output,ctx) => Promise<Record<string,unknown>> | undefined | void`
 * @returns tRPC mutation procedure
 */
export const command = <
  Input extends ZodSchema,
  Output extends ZodSchema,
  AuthContext,
>(
  factory: () => Metadata<Input, Output, AuthContext>,
  tag: Tag,
  track?: Track<Input, Output>,
  commit?: Commit<Input, Output>,
) => {
  const md = factory();
  return buildproc('POST', factory.name, md, tag, track, commit).mutation(
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
export const query = <
  Input extends ZodSchema,
  Output extends ZodSchema,
  AuthContext,
>(
  factory: () => Metadata<Input, Output, AuthContext>,
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
