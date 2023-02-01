import type { TypedRequestBody, TypedResponse } from 'server/types';
import { success } from '../types';
import type { DB } from '../models';
import { AppError } from '../../../common-common/src/errors';

type CreateTemplateAndMetadataReq = {
  abi_id: number;
  name: string;
  template: string;
};

type CreateTemplateAndMetadataResp = {
  template_id: number;
};

export async function createTemplate(
  models: DB,
  req: TypedRequestBody<CreateTemplateAndMetadataReq>,
  res: TypedResponse<CreateTemplateAndMetadataResp>
) {
  const { abi_id, name, template } = req.body;

  if (!abi_id || !name || !template) {
    throw new AppError('Must provide abi_id, name, and template');
  }

  const abi = await models.ContractAbi.findOne({
    where: {
      id: abi_id,
    },
  });

  if (!abi) {
    throw new AppError('ABI does not exist');
  }

  try {
    const newTemplate = await models.Template.create({
      abi_id,
      name,
      template,
    });
    return success(res, { template_id: newTemplate.id });
  } catch (e) {
    throw new AppError('Error creating template');
  }
}
