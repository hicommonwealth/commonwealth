import type { Actor, AuthStrategies } from '@hicommonwealth/core';
import type { Request, Response } from 'express';
import { ZodSchema, z } from 'zod';

/**
 * tRPC request context
 */
export interface Context {
  req: Request;
  res: Response;
  actor: Actor;
}

/**
 * tRPC API Tags
 */
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
  SuperAdmin = 'SuperAdmin',
  DiscordBot = 'DiscordBot',
  Token = 'Token',
  Contest = 'Contest',
  Poll = 'Poll',
}

/**
 * Middleware applied to the output before it is returned to the client.
 * - This is useful for things like logging, analytics, and other side effects.
 * - Applied in the order it is defined in the array.
 * - Use `fireAndForget` wrapper for I/O operations like committing to a canvas, tracking analytics, etc.
 */
export type OutputMiddleware<
  Input extends ZodSchema,
  Output extends ZodSchema,
> = (
  input: z.infer<Input>,
  output: z.infer<Output>,
  ctx: Context,
) => Promise<void>;

/**
 * Overrides for the default metadata for tRPC to work
 */
export type Metadata<Input extends ZodSchema, Output extends ZodSchema> = {
  readonly input: Input;
  readonly output: Output;
  auth: unknown[];
  secure?: boolean;
  authStrategy?: AuthStrategies<Input>;
};

export type BuildProcOptions<
  Input extends ZodSchema,
  Output extends ZodSchema,
> = {
  method: 'GET' | 'POST';
  name: string;
  md: Metadata<Input, Output>;
  tag: Tag;
  outMiddlewares?: Array<OutputMiddleware<Input, Output>>;
  forceSecure?: boolean;
};

/**
 * Supports two options to track analytics
 * 1. A declarative tuple with [event name, optional output mapper]
 * 2. A "general" async mapper that derives the tuple of [event name, data] from input/output
 */
export type Track<Input extends ZodSchema, Output extends ZodSchema> =
  | [string, mapper?: (output: z.infer<Output>) => Record<string, unknown>]
  | ((
      input: z.infer<Input>,
      output: z.infer<Output>,
    ) => Promise<[string, Record<string, unknown>] | undefined>);
