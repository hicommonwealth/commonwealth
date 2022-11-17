import { Response } from 'express';
import { DB } from '../models';
import { AppError } from '../util/errors';
import { success, TypedRequestQuery } from '../types';
import fetchNewSnapshotProposal from '../util/fetchSnapshot'

export const Errors = {
  NoId: 'No id was provided, cannot fetch snapshot proposal',
};

type GetSnapshotProposalReq = { id: string };

const getSnapshotProposal = async (
  models: DB,
  req: TypedRequestQuery<GetSnapshotProposalReq>,
  res: Response,
) => {
  try {
    const { id } = req.query;
    console.log({ id });
    if (!id) {
      throw new AppError(Errors.NoId);
    }
    const proposal = await models.SnapshotProposal.findOne({
      where: { id },
    });

    console.log({ proposal });

    if (!proposal) {
      console.log('no proposal found');
      const createdProposal = await fetchNewSnapshotProposal(id, models);
      return res.json({ status: 'Success', result: createdProposal.toJSON() });
    }
    return res.json({ status: 'success', result: id });
  } catch (err) {
    console.log(err);
    return res.json({ status: 'Failure', result: err.message });
  }
};

export default getSnapshotProposal;
