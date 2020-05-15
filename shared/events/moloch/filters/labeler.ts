import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IMolochEventData } from '../types';

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const labelMolochEvent: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IMolochEventData,
): IEventLabel => {
  return null;
};

export default labelMolochEvent;
