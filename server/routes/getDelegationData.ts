import { Op} from "sequelize";
import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { ChainEventAttributes } from '../models/chain_event';
import { TypedRequestQuery, TypedResponse, success } from '../types';

export const Errors = {
  InvalidEvent: 'Invalid event',
};

export enum GovernanceStandard {
  ERC20Votes,
  Compound,
  Aave
}

type getDelegationDataReq = { delegation_standard: GovernanceStandard, chain: string}
type getDelegationDataResp = ChainEventAttributes[];

const getDelegationData = async (
  models: DB,
  req: TypedRequestQuery<getDelegationDataReq>,
  res: TypedResponse<getDelegationDataResp>
) => {
  // TODO: runtime validation based on params
  //   maybe something like https://www.npmjs.com/package/runtime-typescript-checker
  let chain, error;
  try {
    [chain, error] = await validateChain(models, req.query);
  } catch (err) {
    throw new AppError(err);
  }
  if (error) {
    console.log('It throws an AppError');
    throw new AppError(error);
  }

  try {
    // determine which set of events to query:
    // chainEventId = ${chain}-${event.data.kind.toString()}
    let chainEventIds: string[]
    switch(req.query.delegation_standard) {
      case GovernanceStandard.ERC20Votes:
        chainEventIds = ["delegate-changed", "delegate-votes-changed"]
        break;
      case GovernanceStandard.Compound:
        chainEventIds = ["proposal-executed", "proposal-created", "proposal-canceled", "proposal-queued", "vote-cast"]
        break;
      case GovernanceStandard.Aave:
        chainEventIds = ["proposal-canceled", "proposal-created", 'proposal-executed', 'proposal-queued',
        'vote-emitted','delegate-changed', 'delegate-power-changed']
        break;
      default:
        break;
    }
    const delegationEvents = await models.ChainEvent.findAll({
      where: { chain_event_type_id: {[Op.in]: chainEventIds}, entity_id: chain.id },
    });
    return success(res, delegationEvents.map((v) => v.toJSON()));
  } catch (err) {
    throw new ServerError(err);
  }
};

export default getDelegationData;
