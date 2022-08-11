import { DB } from "../../database";
import { Logger } from "typescript-logging";


export type Ithis = {
  models: DB;
  log: Logger;
}

export async function processChainEntityCUD(
  this: Ithis,
  chainEntityData: {
    chainEntityMeta: {ce_id: number, chain: string};
    cud: 'create'
  }
) {
  if (chainEntityData.cud === 'create') {
    const result = await this.models.ChainEntityMeta.create({
      ce_id: chainEntityData.chainEntityMeta.ce_id,
      chain: chainEntityData.chainEntityMeta.chain
    });
  } else {
    this.log.error(`ChainEntityCUD does not support ${chainEntityData.cud}`);
  }
}
