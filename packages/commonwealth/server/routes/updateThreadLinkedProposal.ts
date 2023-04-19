import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { link, linkSource } from '../models/thread';
import type { DB } from '../models';
import { findAllRoles } from '../util/roles';

export const Errors = {
    NoThread: 'Cannot find thread',
    NotAdminOrOwner: 'Not an admin or owner of this thread',
    InvalidSnapshotProposal: 'Invalid snapshot proposal hash',
    NotValidProposalSource: 'Invalid Proposal source'
};

const updateThreadLinkedProposal = async (
    models: DB,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const chain = req.chain;
    const { thread_id, sources, ids} = req.body;

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

    if(sources.length > 0 && sources.length == ids){
        const links: link[] = sources.map((item, i) => {
            if(typeof linkSource[item as keyof typeof linkSource] === "undefined"){
                new AppError(Errors.NotValidProposalSource)
            }
            return {source: item.source, identifier: ids[i]}
        })
        if(thread.links){
            thread.links.concat(links)
          } else {
            thread.links = links
        }
        await thread.save();
    }

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
  }

  export default updateThreadLinkedProposal;