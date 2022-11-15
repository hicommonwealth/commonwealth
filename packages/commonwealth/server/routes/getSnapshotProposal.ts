import { Response, NextFunction, Request } from 'express';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';
import { success, TypedRequestQuery, TypedResponse } from '../types';

export const Errors = {
  NoId: 'No id was provided, cannot fetch snapshot proposal',
};

type GetSnapshotProposalReq = { id: string };
type GetSnapshotProposalRes = { id: string; space: string; event: string; expire: string };

const getSnapshotProposal = async (
  models: DB,
  req: TypedRequestQuery<GetSnapshotProposalReq>,
  res: TypedResponse<GetSnapshotProposalRes>
) => {
  try {
    const { id } = req.query;
    console.log({ id });
    if (!id) {
      throw new AppError(Errors.NoId);
    }
    const proposal = models.SnapshotProposal.findOne({
      where: { id },
    });

    if (!proposal) {
      console.log('no proposal found');
      // fetch from snapshot API then update the db
    }
    return success(res, {
      id,
      space: 'test',
      event: 'test',
      expire: 'test'
    });
  } catch (err) {
    console.log(err);
  }
};

export default getSnapshotProposal;
