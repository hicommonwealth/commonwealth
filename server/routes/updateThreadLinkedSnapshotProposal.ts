import { Request, Response, NextFunction } from 'express';
import bs58 from 'bs58';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { DB } from '../database';

export const Errors = {
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  MustBeSnapshotChain: 'Thread chain must support snapshot',
  InvalidSnapshotProposal: 'Invalid snapshot proposal hash',
};

const updateThreadLinkedSnapshotProposal = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!chain?.snapshot) {
    return next(new Error(Errors.MustBeSnapshotChain));
  }
  // ensure snapshot proposal is a bs58-encoded sha256 hash
  // const decodedHash = bs58.decodeUnsafe(req.body.snapshot_proposal);
  //  || decodedHash.toString().length !== 256
  // if (!req.body.snapshot_proposal) {
  //   return next(new Error(Errors.InvalidSnapshotProposal));
  // }

  const { thread_id } = req.body;

  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
    },
  });

  if (!thread) return next(new Error(Errors.NoThread));
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified).map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id)) { // is not author
    const roles = await models.Role.findAll({
      where: {
        address_id: { [Op.in]: userOwnedAddressIds, },
        permission: { [Op.in]: ['admin', 'moderator'] },
      }
    });
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) return next(new Error(Errors.NotAdminOrOwner));
  }

  // link snapshot proposal
  if (req.body.snapshot_proposal) {
    thread.snapshot_proposal = req.body.snapshot_proposal;
  } else {
    thread.snapshot_proposal = '';
  }
  await thread.save();

  const finalThread = await models.OffchainThread.findOne({
    where: { id: thread_id, },
    include: [
      {
        model: models.Address,
        as: 'Address'
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators'
      },
      models.OffchainAttachment,
      {
        model: models.Topic,
        as: 'topic'
      }
    ],
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default updateThreadLinkedSnapshotProposal;
