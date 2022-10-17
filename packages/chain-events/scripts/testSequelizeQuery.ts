import models from '../services/database/database';
import {EventKind, ITransfer} from "../src/chains/aave/types";
import {CWEvent, SupportedNetwork} from "../src";
import * as AaveTypes from "../src/chains/aave/types";
import {v4 as uuidv4} from 'uuid';
import {QueryTypes} from "sequelize";


async function testSequelizeQuery() {
  // const ceData: ITransfer = {
  //   kind: EventKind.Transfer,
  //   tokenAddress: "24234738-b09f-465c-930d-405ccffbde6d",
  //   from: "42273d3a-d533-464c-8ae6-31ad5d4daa7b",
  //   to: "c3e40ccd-5f0d-43e4-9f61-224dc7037ecc",
  //   amount: "9c134954-0108-42a9-b55c-005e6f27a245"
  // }
  // // // create a fake aave-transfer event
  // const chainEvent: CWEvent<AaveTypes.IEventData> = {
  //   blockNumber: 325546,
  //   data: ceData,
  //   network: SupportedNetwork.Aave,
  //   chain: 'aave'
  // }

  // const dbResult = await models.ChainEvent.findOne({
  //   where: {
  //     chain_event_type_id: `aave-${EventKind.ProposalCreated}`,
  //   }
  // });

  const dbResult = (<any>(await models.sequelize.query(`
      SELECT MAX(("event_data" ->> 'id') :: int) as max_proposal_id
      FROM "ChainEvents"
      WHERE chain_event_type_id = 'aave-proposal-created';
  `, {raw: true, type: QueryTypes.SELECT}))[0]).max_proposal_id;

  if (!dbResult) console.log("No result");
  else console.log("Database Result:", dbResult);
  process.exit(0);
}

testSequelizeQuery();
