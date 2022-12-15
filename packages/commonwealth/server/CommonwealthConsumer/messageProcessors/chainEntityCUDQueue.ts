import { Logger } from "typescript-logging";
import { RmqEntityCUD } from "common-common/src/rabbitmq/types/chainEntityCUD";
import { DB } from "../../models";

export type Ithis = {
  models: DB;
  log: Logger;
}

export async function processChainEntityCUD(
  this: Ithis,
  data: RmqEntityCUD.RmqMsgType
) {
  RmqEntityCUD.checkMsgFormat(data);
  await this.models.ChainEntityMeta.create({
    ce_id: data.ce_id,
    chain: data.chain_id,
    author: data.author,
    type_id: data.entity_type_id,
  });
}
