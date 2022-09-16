import {
  IRmqMsgCreateChainCUD,
  RabbitMQController,
  RascalPublications,
  RepublishFailedMessages,
  RabbitMQControllerError
} from "common-common/src/rabbitmq";
import {DB} from "../database";
import {factory, formatFilename} from "common-common/src/logging";
import Sequelize from "sequelize";

const log = factory.getLogger(formatFilename(__filename));

export class RepublishChains extends RepublishFailedMessages<DB> {
  constructor(
    _rmqController: RabbitMQController,
    _models: DB
  ) {
    // republish failed messages every 3 minutes
    super(_rmqController, _models, 180000);
  }

  public async job() {
    const result = await this._models.Chain.findAll({
      where: {
        queued: {
          [Sequelize.Op.between]: [0, 5]
        }
      },
      include: [
        {model: this._models.ChainNode}
      ]
    });

    // TODO: if there are more than a certain number this may indicate a more serious problem
    if (result.length > 100) {

    }

    for (const chain of result) {
      const publishData: IRmqMsgCreateChainCUD = {
        chain_id: chain.id,
        base: chain.base,
        network: chain.network,
        chain_node_url: chain.ChainNode.private_url || chain.ChainNode.url,
        active: false, // TODO: update this value
        cud: "create-chain"
      }

      await this._rmqController.safePublish(
        publishData,
        chain.id,
        RascalPublications.ChainCUDChainEvents,
        {
          sequelize: this._models.sequelize,
          model: this._models.Chain
        }
      );
    }
  }
}
