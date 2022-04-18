import validateChain from '../util/validateChain';
import { DB } from '../database';
import { AppError, ServerError } from '../util/errors';
import { ChainEventAttributes } from '../models/chain_event';
import { TypedRequestQuery, TypedResponse, success } from '../types';
import { u8 } from '@polkadot/types';
import { query } from '@polkadot/api-derive/staking';

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
    let chainEventIds: String[]
    switch(req.query.delegation_standard) {
      case GovernanceStandard.ERC20Votes:
        //chainEventIds.add("")
        break;
      case GovernanceStandard.Compound:
        break;
      case GovernanceStandard.Aave:
        break;
    }
    const delegationEvents = await models.ChainEvent.findAll({
      where: { chain_event_type_id: req.query.chain.toString()+"-vote-cast"},
    });
    return success(res, delegationEvents.map((v) => v.toJSON()));
  } catch (err) {
    throw new ServerError(err);
  }
};

export default getDelegationData;
