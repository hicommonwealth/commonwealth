import { IThreadCollaborator } from 'client/scripts/models/Thread';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';

export const Errors = {
  InvalidThread: 'Must provide a valid thread_id',
  InvalidEditor: 'Must provide valid addresses of existing editor',
  InvalidEditorFormat: 'Editors attribute improperly formatted.',
  IncorrectOwner: 'Not owned by this user',
  InvalidAddress: 'Must provide editor address and chain',
};

interface DeleteEditorsBody {
  thread_id: string
  editors: IThreadCollaborator[]
}

const deleteEditors = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.thread_id) {
    return next(new AppError(Errors.InvalidThread));
  }

  const { thread_id, editors } = req.body as DeleteEditorsBody;

  // Ensure editors is an array
  if (!Array.isArray(editors)) {
    return next(new AppError(Errors.InvalidEditorFormat));
  }

  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const thread = await models.Thread.findOne({
    where: {
      id: thread_id,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
  });
  if (!thread) return next(new AppError(Errors.InvalidThread));

  await Promise.all(
    editors.map(async (editor) => {
      const address = await models.Address.findOne({
        where: {
          chain: editor.chain,
          address: editor.address,
        },
      });
      const collaboration = await models.Collaboration.findOne({
        where: {
          thread_id: thread.id,
          address_id: address.id,
        },
      });
      if (collaboration) {
        await collaboration.destroy();
      }
    })
  );

  const finalCollaborations = await models.Collaboration.findAll({
    where: { thread_id: thread.id },
    include: [
      {
        model: models.Address,
        as: 'Address',
      },
    ],
  });

  return res.json({
    status: 'Success',
    result: {
      collaborators: finalCollaborations
        .map((c) => c.toJSON())
        .map((c) => c.Address)
    },
  });
};

export default deleteEditors;
