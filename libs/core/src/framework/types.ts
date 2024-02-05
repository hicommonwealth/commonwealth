import z, { ZodSchema } from 'zod';

/**
 * Error names as constants
 */
export const INVALID_INPUT_ERROR = 'InvalidInputError';
export const INVALID_ACTOR_ERROR = 'InvalidActorError';

/**
 * Represents an actor, embodying a "user interacting with a system" by either executing a command or querying a projection.
 * - Authorization is typically granted based on group membership, role association, or ownership of the targeted entity.
 * - Unique identification is established through the `user.id` (JWT sign-in).
 * - Additional optional attributes may include `address_id` for the active web wallet address.
 *
 * Authorization for actors is facilitated through {@link ActorMiddleware} within the context of the invoked command or query.
 * - When executing a command, the `aggregate` may need loading before completing the authorization process.
 * - Flags like `author`: true can be set by the middleware to indicate the user as the author of the aggregate.
 */
export type Actor = {
  user: User;
  address_id?: string;
  author?: boolean;
};

/**
 * Invalid input error - usually invalid payload schema
 */
export class InvalidInput extends Error {
  public details?: string[];
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
 * Authenticated user, basically generic attributes
 */
export type User = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
};

/**
 * Command execution context
 * - `actor`: user actor
 * - `id`: aggregate identifier
 * - `payload`: validated command payload
 * - `state`: aggregate state
 *   - gets loaded by middleware or command
 *   - gets modified by domain rules (side effects)
 */
export type CommandContext<T, P extends ZodSchema> = {
  actor: Actor;
  id: string;
  payload: z.infer<P>;
  state?: Partial<T> | null;
};

/**
 * Query execution context
 * - `actor`: user actor
 * - `payload`: validated query payload (filters)
 * - `results`: query results
 *
 * TODO: we can use this context to inject extra authorization filters before executing the query
 */
export type QueryContext<T, P extends ZodSchema> = {
  actor: Actor;
  payload: z.infer<P>;
  results?: T | null;
};

/**
 * Middleware utility to authorize command actors (chain of responsibility)
 * @param context command execution context
 * @returns updated context, or throws {@link InvalidActor} when unauthorized
 */
export type CommandMiddleware<T, P extends ZodSchema> = (
  context: CommandContext<T, P>,
) => Promise<CommandContext<T, P> | void>;

/**
 * Middleware utility to authorize query actors (chain of responsibility)
 * @param context query execution context
 * @returns updated context, or throws {@link InvalidActor} when unauthorized
 */
export type QueryMiddleware<T, P extends ZodSchema> = (
  context: QueryContext<T, P>,
) => Promise<QueryContext<T, P>>;

/**
 * Declarative metadata to "enforce" the conventional requirements of a command as a chain of responsibility.
 * Decouples infrastructure concerns from core domain logic, allowing a simpler development and testing pattern.
 * - `schema`: zod schema of the command payload
 * - `load`: loading and authorization chain
 * - `body`: function implementing core domain logic
 * - `save`: function implementing logic to persist the side effects (mutations)
 */
export type CommandMetadata<T, P extends ZodSchema> = {
  schema: P;
  load: CommandMiddleware<T, P>[];
  body: CommandMiddleware<T, P>;
  save: CommandMiddleware<T, P>;
};

/**
 * Declarative metadata to enforce the conventional requirements of a query as a chain of responsibility.
 * - `schema`: zod schema of the query payload (filters)
 * - `auth`: authorization chain
 * - `body`: function implementing the query logic
 */
export type QueryMetadata<T, P extends ZodSchema> = {
  schema: P;
  auth: QueryMiddleware<T, P>[];
  body: QueryMiddleware<T, P>;
};
