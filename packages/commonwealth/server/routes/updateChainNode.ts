import {DB} from "../database";
import {NextFunction, Request, Response} from "express";
import {IRmqMsgUpdateChainNodeCUD, RabbitMQController, RascalPublications} from "common-common/src/rabbitmq";
import {success} from "../types";

const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Not an admin',
  NoChainNodeId: 'Must provide chain node ID',
  noChainNodeFound: 'ChainNode not found'
}

const updateChainNode = async (
  models: DB,
  rabbitMQController: RabbitMQController,
  req: Request,
  res: Response,
  next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.id) return next(new Error(Errors.NoChainNodeId));

  const chainNode = await models.ChainNode.findOne({
    where: {id: req.body.id}
  })
  if (!chainNode) return next(new Error(Errors.noChainNodeFound));
  else if (!req.user.isAdmin) return next(new Error(Errors.NotAdmin));


  const {url, eth_chain_id, alt_wallet_url, private_url, balance_type, name, description} = req.body

  if (url || private_url) {
    const publishData: IRmqMsgUpdateChainNodeCUD = {
      new_url: private_url || url,
      old_url: chainNode.private_url || chainNode.private_url,
      cud: 'update-chainNode'
    }
    await rabbitMQController.publish(publishData, RascalPublications.ChainCUDChainEvents);
  }

  if (url) chainNode.url = url;
  if (eth_chain_id) chainNode.eth_chain_id = eth_chain_id;
  if (alt_wallet_url) chainNode.alt_wallet_url = alt_wallet_url;
  if (private_url) chainNode.private_url = private_url;
  if (balance_type) chainNode.balance_type = balance_type;
  if (name) chainNode.name = name;
  if (description) chainNode.description = description;

  await chainNode.save();

  return success(res, chainNode.toJSON());
}

export default updateChainNode;
