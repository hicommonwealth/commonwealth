import { AppError } from '@hicommonwealth/adapters';
import type {
  TypedRequestBody,
  TypedRequestQuery,
  TypedResponse,
} from 'server/types';
import isValidJson from '../../shared/validateJson';
import type { DB } from '../models';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

type CreateTemplateAndMetadataReq = {
  contract_id: string;
  name: string;
  template: string;
  description: string;
  chain_id: string;
  created_by: string;
  created_for_community: string;
};

type CreateTemplateAndMetadataResp = {
  template_id: number;
};

type DeleteTemplateAndMetadataReq = {
  template_id: string;
};

export async function createTemplate(
  models: DB,
  req: TypedRequestBody<CreateTemplateAndMetadataReq>,
  res: TypedResponse<CreateTemplateAndMetadataResp>,
) {
  const {
    contract_id,
    name,
    template,
    chain_id,
    description,
    created_by,
    created_for_community,
  } = req.body;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: chain_id,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError('Must be admin');
  }

  if (!contract_id || !name || !template) {
    throw new AppError('Must provide contract_id, name, and template');
  }

  const templateJson = JSON.parse(template.replace(/\s/g, ''));

  if (!isValidJson(templateJson)) {
    throw new AppError('Template must be valid JSON');
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
      description,
      created_by,
      created_for_community,
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
  res: TypedResponse<getTemplateAndMetadataResp>,
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
    throw new AppError('Missing abi_id');
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

    const templatePromises = templates.map(async (template) => {
      const inUse = await models.CommunityContractTemplate.findOne({
        where: {
          template_id: template.id,
        },
      });

      return {
        ...template.toJSON(),
        inUse: !!inUse,
      };
    });

    const templatesWithInUse = await Promise.all(templatePromises);
    return success(res, { templates: templatesWithInUse });
  } catch (e) {
    throw new AppError('Error getting templates');
  }
}

export async function deleteTemplate(
  models: DB,
  req: TypedRequestBody<DeleteTemplateAndMetadataReq>,
  res: TypedResponse<{ message: string }>,
) {
  const { template_id } = req.body;

  const template = await models.Template.findOne({
    where: {
      id: template_id,
    },
  });

  if (!template) {
    throw new AppError('Template does not exist');
  }

  try {
    await template.destroy();
    return success(res, { message: 'Template deleted' });
  } catch (e) {
    console.log(e);
    throw new AppError('Error deleting template');
  }
}
