import type {
  TypedRequestBody,
  TypedRequestQuery,
  TypedResponse,
} from 'server/types';
import { success } from '../types';
import type { DB } from '../models';
import { AppError } from '../../../common-common/src/errors';

type CreateTemplateAndMetadataReq = {
  contract_id: string;
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
  const { contract_id, name, template } = req.body;

  if (!contract_id || !name || !template) {
    throw new AppError('Must provide contract_id, name, and template');
  }

  const contract = await models.Contract.findOne({
    where: {
      id: contract_id,
    },
  });

  const abi = await models.ContractAbi.findOne({
    where: {
      id: contract.abi_id,
    },
  });

  if (!contract || !abi) {
    throw new AppError('Contract or Contract ABI does not exist');
  }

  try {
    const newTemplate = await models.Template.create({
      abi_id: contract.abi_id,
      name,
      template,
    });
    return success(res, { template_id: newTemplate.id });
  } catch (e) {
    console.log(e);
    throw new AppError('Error creating template');
  }
}

type getTemplateAndMetadataReq = {
  contract_id: number;
};

type getTemplateAndMetadataResp = {
  templates: Array<any>; // TODO: type this
};

export async function getTemplates(
  models: DB,
  req: TypedRequestQuery<getTemplateAndMetadataReq>,
  res: TypedResponse<getTemplateAndMetadataResp>
) {
  const { contract_id } = req.query;

  const contract = await models.Contract.findOne({
    where: {
      id: contract_id,
    },
  });

  if (!contract) {
    throw new AppError('Contract does not exist');
  }

  const abi_id = contract?.abi_id;

  if (!abi_id) {
    throw new AppError('Must provide abi_id');
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
    const templates = await models.Template.findAll({
      where: {
        abi_id,
      },
    });
    return success(res, { templates });
  } catch (e) {
    throw new AppError('Error getting templates');
  }
}
