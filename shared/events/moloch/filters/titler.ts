import { MolochEventKind } from '../types';
import { IEventTitle, TitlerFilter } from '../../interfaces';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const titlerFunc: TitlerFilter = (kind: MolochEventKind): IEventTitle => {
  return null;
};

export default titlerFunc;
