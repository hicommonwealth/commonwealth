import { Events, events } from '@hicommonwealth/schemas';
import z, { ZodType, ZodUndefined } from 'zod';

/**
 * Error names as constants
 */
export const INVALID_INPUT_ERROR = 'Invalid Input Error';
export const INVALID_ACTOR_ERROR = 'Invalid Actor Error';
export const INVALID_STATE_ERROR = 'Invalid State Error';

export const ExternalServiceUserIds = {
  Knock: -1,
  K6: -2,
} as const;

export type AuthStrategies<Input extends ZodType> =
  | {
      type: 'jwt' | 'authtoken';
      userId?: (typeof ExternalServiceUserIds)[keyof typeof ExternalServiceUserIds];
    }
  | {
      type: 'custom';
      name: string;
      userResolver: (payload: z.infer<Input>, user?: User) => Promise<User>;
    };

/**
 * Deep partial utility
 */
export type DeepPartial<T> =
  T extends Array<infer I>
    ? Array<DeepPartial<I>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/**
 * Represents a user in the system with attributes commonly provided by authentication infrastructure
 */
export type User = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
  auth?: Record<string, unknown>; // custom auth payload
};

/**
 * Represents an actor, embodying a "user interacting with a system" by either executing a command or querying a projection.
 * - Authorization is typically granted based on group membership, role association, or ownership of the targeted entity.
 * - Unique identification is established through the `user.id`
 * - Extends users with additional (optional) attributes that may include:
 *   - `address` for the active web wallet address
 *   - `is_system_actor` for policy actors that are not real users
 *
 * Authorization for actors is facilitated through {@link CommandHandler} or {@link QueryHandler} middleware within the context of the invoked command or query.
 * - When executing a command, the `aggregate` may need loading before completing the authorization process.
 */
export type Actor = {
  readonly user: Readonly<User>;
  readonly address?: string;
  readonly address_id?: number;
  readonly community_id?: string;
  readonly role?: string;
  readonly is_system_actor?: boolean;
};

/**
 * Invalid input error - usually invalid payload schema
 */
export class InvalidInput extends Error {
  public readonly details?: string[];

  constructor(message: string, details?: string[]) {
    super(details ? `${message}:\n${details.join('\n')}` : message);
    this.name = INVALID_INPUT_ERROR;
    this.details = details;
  }
}

/**
 * Invalid actor error - usually unauthorized users
 */
export class InvalidActor extends Error {
  constructor(
    public actor: Actor,
    message: string,
  ) {
    super(message);
    this.name = INVALID_ACTOR_ERROR;
  }
}

/**
 * Invalid state error - usually domain invariant violations
 */
export class InvalidState extends Error {
  constructor(
    message: string,
    public readonly state?: unknown,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = INVALID_STATE_ERROR;
  }
}

/**
 * Command/Query execution context
 * - `actor`: user actor
 * - `payload`: validated command payload
 * - `auth`: authorization context
 */
export type Context<Input extends ZodType, _Context extends ZodType> = {
  readonly actor: Actor;
  readonly payload: z.infer<Input>;
  readonly context?: z.infer<_Context>;
};

/**
 * Event execution context
 * - `name`: event name
 * - `payload`: validated event payload
 */
export type EventContext<Name extends Events> = {
  readonly id: number;
  readonly name: Name;
  readonly payload: z.infer<(typeof events)[Name]>;
};

/**
 * Command/Query handler
 * @param context execution context
 * @returns output of the command/query
 * @throws {@link InvalidActor} when unauthorized
 */
export type BodyHandler<
  Input extends ZodType,
  Output extends ZodType,
  _Context extends ZodType,
> = (context: Context<Input, _Context>) => Promise<z.infer<Output>>;

/**
 * Middleware handler
 * @param context execution context
 * @throws {@link InvalidActor} when unauthorized
 */
export type AuthHandler<Input extends ZodType, _Context extends ZodType> = (
  context: Context<Input, _Context>,
) => Promise<void>;

/**
 * Event handler
 * @param context event execution context
 * @returns may return updated state - side effects
 */
export type EventHandler<
  Name extends Events,
  Output extends ZodType | ZodUndefined,
> = (context: EventContext<Name>) => Promise<Partial<z.infer<Output>> | void>;

/**
 * Declarative metadata to "enforce" the conventional requirements of a command or query as a chain of responsibility.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schema`: zod schema of the command payload
 * - `auth`: authorization chain, may preload the aggregate when necessary
 * - `body`: function implementing core domain logic, and returning side effects (mutations)
 * - `secure`: true when user requires authentication
 */
export type Metadata<
  Input extends ZodType,
  Output extends ZodType,
  _Context extends ZodType,
> = {
  readonly input: Input;
  readonly output: Output;
  readonly context?: _Context;
  readonly auth: AuthHandler<Input, _Context>[];
  readonly body: BodyHandler<Input, Output, _Context>;
  readonly secure?: boolean;
  readonly authStrategy?: AuthStrategies<Input>;
};

/**
 * Domain event schemas
 */
export type EventSchemas = {
  [Name in Events]?: (typeof events)[Name];
};

/**
 * Declarative metadata to "enforce" the conventional requirements of event handlers.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schemas`: zod schemas of the input events
 * - `body`: functions implementing the core handlers, and returning side effects
 */
export type EventsHandlerMetadata<
  Inputs extends EventSchemas,
  Output extends ZodType | ZodUndefined = ZodUndefined,
> = {
  readonly inputs: Inputs;
  readonly output?: Output;
  readonly body: {
    readonly [Name in keyof Inputs & Events]: EventHandler<Name, Output>;
  };
};

// =========== PUBLIC ARTIFACT FACTORY INTERFACE ===========
export type Schemas<
  Input extends ZodType,
  Output extends ZodType,
  _Context extends ZodType,
> = {
  input: Input;
  output: Output;
  context?: _Context;
};

/**
 * Command metadata
 */
export type Command<Schema> =
  Schema extends Schemas<infer Input, infer Output, infer _Context>
    ? Metadata<Input, Output, _Context>
    : never;

/**
 * Query metadata
 */
export type Query<Schema> =
  Schema extends Schemas<infer Input, infer Output, infer _Context>
    ? Metadata<Input, Output, _Context>
    : never;

/**
 * Policy metadata
 */
export type Policy<
  Inputs,
  Output extends ZodType | ZodUndefined = ZodUndefined,
> = Inputs extends EventSchemas ? EventsHandlerMetadata<Inputs, Output> : never;

/**
 * Projection metadata
 */
export type Projection<
  Inputs,
  Output extends ZodType | ZodUndefined = ZodUndefined,
> = Inputs extends EventSchemas ? EventsHandlerMetadata<Inputs, Output> : never;
