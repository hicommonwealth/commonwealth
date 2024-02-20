import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { TypedRequestParams } from 'server/types';

export const getNamespaceMetadata = async (
  models: DB,
  req: TypedRequestParams<{ namespace: string; stake_id: string }>,
  res: any,
) => {
  //stake_id will be a 32 byte hex string, convert to number
  const decodedId = parseInt(req.params.stake_id, 16);
  const metadata = await models.Community.findOne({
    where: {
      namespace: req.params.namespace,
    },
    include: [
      {
        model: models.CommunityStake,
        required: true,
        attributes: ['stake_id'],
        where: {
          stake_id: decodedId,
        },
      },
    ],
    attributes: ['namespace', 'icon_url'],
  });

  if (!metadata) {
    throw new AppError('Token metadata does not exist');
  }

  return res.json({
    name: `${metadata.namespace} Community Stake`,
    image: metadata.icon_url,
  });
};
