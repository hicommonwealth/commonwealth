import z, { ZodSchema } from 'zod';

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
 * Command execution context
 * - `actor`: user actor
 * - `id`: aggregate identifier
 * - `payload`: validated command payload
 */
export type CommandContext<P extends ZodSchema> = {
  readonly actor: Actor;
  readonly id: string;
  readonly payload: z.infer<P>;
};

/**
 * Query execution context
 * - `actor`: user actor
 * - `payload`: validated query payload (filters)
 *
 * TODO: we can use this context to inject extra authorization filters before executing the query
 */
export type QueryContext<P extends ZodSchema> = {
  readonly actor: Actor;
  readonly payload: z.infer<P>;
};

/**
 * Middleware utility to authorize command actors (chain of responsibility)
 * @param context command execution context
 * @param state aggregate state, loaded and modified by domain rules (side effects)
 * @returns may return updated state when preloading aggreggate to verify authority
 * @throws {@link InvalidActor} when unauthorized
 */
export type CommandHandler<T, P extends ZodSchema> = (
  context: CommandContext<P>,
  state?: Partial<T>,
) => Promise<Partial<T> | void>;

/**
 * Middleware utility to authorize query actors (chain of responsibility)
 * @param context query execution context
 * @returns query results
 * @throws {@link InvalidActor} when unauthorized
 */
export type QueryHandler<T, P extends ZodSchema> = (
  context: QueryContext<P>,
) => Promise<T | undefined>;

/**
 * Declarative metadata to "enforce" the conventional requirements of a command as a chain of responsibility.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schema`: zod schema of the command payload
 * - `auth`: authorization chain, may preload the aggregate when necessary
 * - `body`: function implementing core domain logic, and returning side effects (mutations)
 */
export type CommandMetadata<T, P extends ZodSchema> = {
  schema: P;
  auth: CommandHandler<T, P>[];
  body: CommandHandler<T, P>;
};

/**
 * Declarative metadata to enforce the conventional requirements of a query as a chain of responsibility.
 * - `schema`: zod schema of the query payload (filters)
 * - `auth`: authorization chain, may inject more filters to the payload
 * - `body`: function implementing the query logic
 */
export type QueryMetadata<T, P extends ZodSchema> = {
  schema: P;
  auth: QueryHandler<T, P>[];
  body: QueryHandler<T, P>;
};
