import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { linkSource } from '../models/thread';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

export const Errors = {
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  MustBeSnapshotChain: 'Thread chain must support snapshot',
  InvalidSnapshotProposal: 'Invalid snapshot proposal hash',
};

const updateThreadLinkedSnapshotProposal = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  const snapshotSpaces = await models.CommunitySnapshotSpaces.findAll({
    where: {
      chain_id: chain.id,
    },
  });
  if (snapshotSpaces.length < 1) {
    return next(new AppError(Errors.MustBeSnapshotChain));
  }
  // ensure snapshot proposal is a bs58-encoded sha256 hash
  // const decodedHash = bs58.decodeUnsafe(req.body.snapshot_proposal);
  //  || decodedHash.toString().length !== 256
  // if (!req.body.snapshot_proposal) {
  //   return next(new AppError(Errors.InvalidSnapshotProposal));
  // }

  const { thread_id } = req.body;

  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
    },
  });

  if (!thread) return next(new AppError(Errors.NoThread));
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id)) {
    // is not author
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      chain.id,
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) return next(new AppError(Errors.NotAdminOrOwner));
  }

  // link snapshot proposal
  if (req.body.snapshot_proposal) {
    thread.snapshot_proposal = req.body.snapshot_proposal;
    const link = {source: linkSource.Snapshot, identifier: req.body.snapshot_proposal}
    if(thread.links){
      thread.links.push(link)
    } else {
      thread.links = [link]
    }
  } else {
    thread.snapshot_proposal = '';
  }
  await thread.save();

  const finalThread = await models.Thread.findOne({
    where: { id: thread_id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
      {
        model: models.Address,
        // through: models.Collaboration,
        as: 'collaborators',
      },
      models.Attachment,
      {
        model: models.Topic,
        as: 'topic',
      },
    ],
  });

  return res.json({ status: 'Success', result: finalThread.toJSON() });
};

export default updateThreadLinkedSnapshotProposal;
