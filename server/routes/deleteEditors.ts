import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import lookupCommunityIsVisibleToUser, { ChainCommunityError } from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';
import { NotificationCategories } from '../../shared/types';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of existing editor',
  InvalidEditorFormat: 'Editors attribute improperly formatted.',
  IncorrectOwner: 'Not owned by this user',
  InvalidAddress: 'Must provide editor address and chain',
};

const deleteEditors = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.thread_id) {
    return next(new Error(Errors.InvalidThread));
  }
  const { thread_id } = req.body;
  let editors;
  try {
    const editorsObj = JSON.parse(req.body.editors);
    editors = Object.values(editorsObj);
  } catch (e) {
    return next(new Error(Errors.InvalidEditorFormat));
  }
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (!chain && !community) return next(new Error(ChainCommunityError));
  const author = await lookupAddressIsOwnedByUser(models, req, next);

  const userOwnedAddressIds = await (req.user as any).getAddresses()
    .filter((addr) => !!addr.verified).map((addr) => addr.id);
  const thread = await models.OffchainThread.findOne({
    where: {
      id: thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });
  if (!thread) return next(new Error(Errors.InvalidThread));

  await Promise.all(editors.map(async (editor: any) => {
    const address = await models.Address.findOne({
      where: {
        chain: editor.chain,
        address: editor.address,
      },
    });
    const collaboration = await models.Collaboration.findOne({
      where: {
        offchain_thread_id: thread.id,
        address_id: address.id
      }
    });
    if (collaboration) {
      await collaboration.destroy();
    }
  }));

  const finalEditors = await models.Collaboration.findAll({
    where: { offchain_thread_id: thread.id },
    include: [{
      model: models.Address,
    }]
  });

  return res.json({
    status: 'Success',
    result: {
      collaborators: finalEditors.map((e) => e.Address.toJSON())
    },
  });
};

export default deleteEditors;
