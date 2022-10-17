import { DB } from "../../models";
import { Logger } from "typescript-logging";
import {isRmqMsgCreateEntityCUD, TRmqMsgEntityCUD} from "common-common/src/rabbitmq/types/chainEntityCUD";


export type Ithis = {
  models: DB;
  log: Logger;
}

export async function processChainEntityCUD(
  this: Ithis,
  data: TRmqMsgEntityCUD
) {
  if (isRmqMsgCreateEntityCUD(data)) {
    const result = await this.models.ChainEntityMeta.create({
      ce_id: data.ce_id,
      chain: data.chain_id
    });
  } else {
    this.log.error(`ChainEntityCUD does not support the given data: ${JSON.stringify(data)}`);
  }
}
