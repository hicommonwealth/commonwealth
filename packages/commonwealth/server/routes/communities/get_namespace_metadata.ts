import { AppError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { TypedRequestParams } from 'server/types';

const HEX_ID_REGEX = /^[0-9a-f]{64}$/;

export const getNamespaceMetadata = async (
  models: DB,
  req: TypedRequestParams<{ namespace: string; stake_id: string }>,
  res: any,
) => {
  if (!HEX_ID_REGEX.test(req.params.stake_id)) {
    throw new AppError('Invalid id');
  }

  if (!req.params.namespace) {
    throw new AppError('Invalid namespace');
  }

  //stake_id will be a 32 byte hex string, convert to number
  const decodedId = parseInt(req.params.stake_id, 16);
  if (isNaN(decodedId)) {
    throw new AppError('Invalid id');
  }
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
