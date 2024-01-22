import type { DB } from '@hicommonwealth/model';
import type { Response } from 'express';
import type { TypedRequestQuery } from '../types';
import fetchNewSnapshotProposal from '../util/fetchSnapshot';

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
    if (!id) {
      return res.status(400).json({ error: Errors.NoId });
    }

    const proposal = await models.SnapshotProposal.findOne({
      where: { id },
    });

    if (!proposal) {
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
