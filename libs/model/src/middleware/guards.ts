import {
  InvalidActor,
  InvalidState,
  logger,
  type Actor,
} from '@hicommonwealth/core';
import {
  AuthContext,
  CommentContext,
  PollContext,
  ThreadContext,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import type { AddressInstance, PollInstance, ThreadInstance } from '../models';

const log = logger(import.meta);

/**
 * Guards for existing models. Throws InvalidState error when undefined
 * @param subject state description
 * @param state state representing a model
 */
export function mustExist<T>(
  subject: string,
  state?: T | null,
): asserts state is NonNullable<T> {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
}

/**
 * Guards for non existing models. Throws InvalidState error when defined
 * @param subject state description
 * @param state state representing a model
 */
export function mustNotExist<T>(
  subject: string,
  state?: T | null,
): asserts state is null | undefined {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
}

/**
 * Used for error reporting if data is missing or corrupt in a query.
 * Won't throw errors if data is missing, but will at least log an error
 * so we are made aware of the issue.
 * @param subject state description
 * @param state state representing a model
 * @returns true if state is defined, false if undefined
 */
export function shouldExist<T>(subject: string, state?: T | null) {
  if (!state) {
    const err = new InvalidState(`${subject} should exist`, state);
    log.error(err.message, err);
    return false;
  }
  return true;
}

/**
 * Guards for super admin actors
 * @param actor current actor
 */
export function mustBeSuperAdmin(actor: Actor) {
  if (!actor.user.isAdmin)
    throw new InvalidActor(actor, 'Must be super administrator');
}

/**
 * Address authorization guard
 * @param context auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorized(actor: Actor, context?: AuthContext) {
  if (!context?.address) throw new InvalidActor(actor, 'Not authorized');
  return context as AuthContext & {
    address: AddressInstance;
    community_id: string;
  };
}

/**
 * Thread authorization guard
 * @param context auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorizedThread(actor: Actor, context?: ThreadContext) {
  if (!context?.address) throw new InvalidActor(actor, 'Not authorized');
  if (!context?.thread) throw new InvalidActor(actor, 'Not authorized thread');
  return context as AuthContext & {
    address: AddressInstance;
    thread: ThreadInstance;
    community_id: string;
    topic_id: number;
    thread_id: number;
  };
}

/**
 * Comment authorization guard
 * @param context auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorizedComment(
  actor: Actor,
  context?: CommentContext,
) {
  if (!context?.address) throw new InvalidActor(actor, 'Not authorized');
  if (!context?.comment)
    throw new InvalidActor(actor, 'Not authorized comment');
  return context as CommentContext & {
    address: AddressInstance;
    comment: ThreadInstance;
    community_id: string;
    topic_id: number;
    thread_id: number;
    comment_id: number;
  };
}

export function mustBeAuthorizedPoll(actor: Actor, context?: PollContext) {
  if (!context?.address) throw new InvalidActor(actor, 'Not authorized');
  if (!context?.poll) throw new InvalidActor(actor, 'Not authorized poll');
  return context as PollContext & {
    address: AddressInstance;
    poll: PollInstance;
    thread: ThreadInstance;
  };
}

/**
 * Guards for starting and ending dates to be in a valid date range
 * @param start_date start date
 * @param end_date end date
 * @param startDaysInTheFuture number of days in the future that the start date must be
 * @param minDaysInRange
 * @returns { start, end } start and end dates as moment objects
 */
export function mustBeValidDateRange(
  start_date: Date,
  end_date: Date,
  startDaysInTheFuture = 1,
  minDaysInRange = 1,
) {
  const today = moment(new Date());
  const start = moment(start_date);
  const end = moment(end_date);

  // check if start date is in the future by more than startDaysInTheFuture
  const firstValidStartDate = today.add(startDaysInTheFuture, 'days');
  if (start.isBefore(firstValidStartDate))
    throw new InvalidState(
      `Start date ${start.format('YYYY-MM-DD')} must be at least ${startDaysInTheFuture} days in the future`,
      { start_date, end_date },
    );

  // check that end date is after start date by more than minDaysInRange
  const rangeInDays = end.diff(start, 'days');
  if (rangeInDays < minDaysInRange)
    throw new InvalidState(
      `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')} must be at least ${minDaysInRange} days apart.`,
      { start_date, end_date },
    );

  return { start, end };
}

/**
 * Guards for current date to be before date range
 * @param start_date start date
 */
export function mustNotBeStarted(start_date: Date) {
  const start = moment(start_date);
  if (start.isBefore(new Date()))
    throw new InvalidState(
      `Start date ${start.format('YYYY-MM-DD')} already passed`,
      { start_date },
    );
}
