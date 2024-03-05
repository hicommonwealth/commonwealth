import z, { ZodSchema, ZodUndefined } from 'zod';
import { events } from '../schemas';

/**
 * Error names as constants
 */
export const INVALID_INPUT_ERROR = 'Invalid Input Error';
export const INVALID_ACTOR_ERROR = 'Invalid Actor Error';
export const INVALID_STATE_ERROR = 'Invalid State Error';

/**
 * Represents a user in the system with attributes commonly provided by authentication infrastructure
 */
export type User = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
};

/**
 * Represents an actor, embodying a "user interacting with a system" by either executing a command or querying a projection.
 * - Authorization is typically granted based on group membership, role association, or ownership of the targeted entity.
 * - Unique identification is established through the `user.id`
 * - Extends users with additional (optional) attributes that may include:
 *   - `address_id` for the active web wallet address
 *
 * Authorization for actors is facilitated through {@link CommandHandler} or {@link QueryHandler} middleware within the context of the invoked command or query.
 * - When executing a command, the `aggregate` may need loading before completing the authorization process.
 */
export type Actor = {
  readonly user: Readonly<User>;
  readonly address_id?: string;
};

/**
 * Invalid input error - usually invalid payload schema
 */
export class InvalidInput extends Error {
  public readonly details?: string[];
  constructor(message: string, details?: string[]) {
    super(message);
    this.name = INVALID_INPUT_ERROR;
    this.details = details;
  }
}

/**
 * Invalid actor error - usually unauthorized users
 */
export class InvalidActor extends Error {
  constructor(public actor: Actor, message: string) {
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
 * Endpoint schemas
 */
export type Schemas<
  Input extends ZodSchema = ZodSchema,
  Output extends ZodSchema = ZodSchema,
> = {
  readonly input: Input;
  readonly output: Output;
};

/**
 * Command execution context
 * - `actor`: user actor
 * - `payload`: validated command payload
 * - `id`: optional aggregate identifier
 *   - Currently generated by the DB/ORM layer when creating some aggregates (might need future refactoring to support other DBs/scalability)
 */
export type CommandContext<S extends Schemas> = {
  readonly actor: Actor;
  readonly payload: z.infer<S['input']>;
  readonly id?: string;
};

/**
 * Query execution context
 * - `actor`: user actor
 * - `payload`: validated query payload (filters)
 *
 * TODO: we can use this context to inject extra authorization filters before executing the query
 */
export type QueryContext<S extends Schemas> = {
  readonly actor: Actor;
  readonly payload: z.infer<S['input']>;
};

/**
 * Event execution context
 * - `name`: event name
 * - `payload`: validated event payload
 */
export type EventContext<Name, Input extends ZodSchema> = {
  readonly name: Name;
  readonly payload: z.infer<Input>;
};

/**
 * Command handler - can be chained to authorize command actors
 * @param context command execution context
 * @param state aggregate state, loaded and modified by domain rules (side effects)
 * @returns may return updated state when preloading aggreggate to verify authority
 * @throws {@link InvalidActor} when unauthorized
 */
export type CommandHandler<S extends Schemas> = (
  context: CommandContext<S>,
  state?: Partial<z.infer<S['input']>>,
) => Promise<Partial<z.infer<S['output']>> | void>;

/**
 * Query handler - can be chained to authorize query actors
 * @param context query execution context
 * @returns query results
 * @throws {@link InvalidActor} when unauthorized
 */
export type QueryHandler<S extends Schemas> = (
  context: QueryContext<S>,
) => Promise<z.infer<S['output']> | undefined>;

/**
 * Event handler
 * @param context event execution context
 * @returns may return updated state - side effects
 */
export type EventHandler<Name, S> = S extends Schemas
  ? (
      context: EventContext<Name, S['input']>,
    ) => Promise<Partial<z.infer<S['output']>> | void>
  : never;

/**
 * Declarative metadata to "enforce" the conventional requirements of a command as a chain of responsibility.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schema`: zod schema of the command payload
 * - `auth`: authorization chain, may preload the aggregate when necessary
 * - `body`: function implementing core domain logic, and returning side effects (mutations)
 * - `secure`: true when user requires authentication
 */
export type CommandMetadata<S extends Schemas> = {
  readonly schemas: S;
  readonly auth: CommandHandler<S>[];
  readonly body: CommandHandler<S>;
  readonly secure?: boolean;
};

/**
 * Declarative metadata to enforce the conventional requirements of a query as a chain of responsibility.
 * - `schema`: zod schema of the query payload (filters)
 * - `auth`: authorization chain, may inject more filters to the payload
 * - `body`: function implementing the query logic
 * - `secure`: true when user requires authentication
 */
export type QueryMetadata<S extends Schemas> = {
  readonly schemas: S;
  readonly auth: QueryHandler<S>[];
  readonly body: QueryHandler<S>;
  readonly secure?: boolean;
};

/**
 * Domain event schemas
 */
export type EventSchemas = {
  [Name in events.Events]?: typeof events.schemas[Name];
};

/**
 * Declarative metadata to "enforce" the conventional requirements of event handlers.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schemas`: zod schemas of the input events
 * - `body`: functions implementing the core handlers, and returning side effects
 */
export type EventsHandlerMetadata<
  Inputs extends EventSchemas,
  Output extends ZodSchema = ZodUndefined,
> = {
  readonly inputs: Inputs;
  readonly output?: Output;
  readonly body: {
    readonly [Name in keyof Inputs]: EventHandler<
      Name,
      { input: Inputs[Name]; output: Output }
    >;
  };
};

/**
 * Declarative metadata to "enforce" the conventional requirements of policies.
 */
export type PolicyMetadata<
  Inputs extends EventSchemas,
  Output extends ZodSchema = ZodUndefined,
> = EventsHandlerMetadata<Inputs, Output>;

/**
 * Declarative metadata to "enforce" the conventional requirements of projections.
 */
export type ProjectionMetadata<
  Inputs extends EventSchemas,
  Output extends ZodSchema = ZodUndefined,
> = EventsHandlerMetadata<Inputs, Output>;
