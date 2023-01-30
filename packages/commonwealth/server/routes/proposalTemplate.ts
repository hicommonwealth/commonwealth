import { AppError } from 'common-common/src/errors';
import { Request, Response } from 'express';
import { DB } from '../models';
import { CommunityContractTemplateAttributes } from '../models/community_contract_template';
import { CommunityContractTemplateMetadataAttributes } from '../models/community_contract_metadata';
import { TypedRequestBody, TypedResponse, success, failure } from '../types';

type CreateCommunityContractTemplateAndMetadataReq = {
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  community_id: string;
  contract_id: number;
  template_id: number;
};

type CreateCommunityContractTemplateAndMetadataResp = {
  metadata: CommunityContractTemplateMetadataAttributes;
  cct: CommunityContractTemplateAttributes;
};

export async function createCommunityContractTemplateAndMetadata(
  models: DB,
  req: TypedRequestBody<CreateCommunityContractTemplateAndMetadataReq>,
  res: TypedResponse<CreateCommunityContractTemplateAndMetadataResp>
) {
  const {
    slug,
    nickname,
    display_name,
    display_options,
    community_id,
    contract_id,
    template_id,
  } = req.body;

  if (!community_id || !contract_id || !template_id) {
    throw new AppError(
      'Must provide community_id, contract_id, and template_id'
    );
  }

  if (!slug || !nickname || !display_name || !display_options) {
    throw new AppError(
      'Must provide slug, nickname, display_name, and display_options'
    );
  }

  try {
    const newCCT = await models.CommunityContractTemplate.create({
      community_id,
      contract_id,
      template_id,
    });

    const newMetadata = await models.CommunityContractTemplateMetadata.create({
      slug,
      nickname,
      display_name,
      display_options,
      cct_id: newCCT.id,
    });

    return success(res, { metadata: newMetadata, cct: newCCT });
  } catch (err) {
    throw new AppError(
      'Unkown Server error creating community contract template'
    );
  }
}

export async function getCommunityContractTemplate(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide request body as json',
      });
    }
    const contractTemplate: CommunityContractTemplateAttributes =
      req.body.contract;

    if (!contractTemplate) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractTemplate.findOne({
      where: {
        template_id: contractTemplate.template_id,
      },
    });

    if (!contract) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    return res.status(200).json({ status: 'Success', data: contract });
  } catch (err) {
    throw new AppError('Error getting community contract template');
  }
}

export async function updateCommunityContractTemplate(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template',
      });
    }

    const contractTemplate: CommunityContractTemplateAttributes =
      req.body.contract;

    if (!contractTemplate) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractTemplate.findOne({
      where: {
        template_id: contractTemplate.template_id,
      },
    });

    if (!contract) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    const updated = await contract.update(contractTemplate);

    return res.status(200).json({ status: 'Success', data: updated });
  } catch (err) {
    throw new AppError('Error updating community contract template');
  }
}

export async function deleteCommunityContractTemplate(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template',
      });
    }

    const contractTemplate: CommunityContractTemplateAttributes =
      req.body.contract;

    if (!contractTemplate) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractTemplate.findOne({
      where: {
        template_id: contractTemplate.template_id,
      },
    });

    if (!contract) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    await contract.destroy();

    return res.status(200).json({ status: 'Success', data: contract });
  } catch (err) {
    throw new AppError('Error deleting community contract template');
  }
}

export async function getCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    const { cct_id } = req.body.contractMetadata;
    if (!cct_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide cct_id',
      });
    }

    const contract = await models.CommunityContractTemplateMetadata.findOne({
      where: {
        cct_id,
      },
    });

    return res.status(200).json({ status: 'Success', data: contract });
  } catch (err) {
    throw new AppError('Error getting community contract template metadata');
  }
}

export async function updateCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }

    const contractTemplateMetadata: CommunityContractTemplateMetadataAttributes =
      req.body.contractMetadata;

    if (!contractTemplateMetadata) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractTemplateMetadata.findOne({
      where: {
        cct_id: contractTemplateMetadata.cct_id,
      },
    });

    if (!contract) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    return res.json({ status: 'Success', data: contract });
  } catch (err) {
    throw new AppError('Error updating community contract template metadata');
  }
}

export async function deleteCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }

    const contractTemplateMetadata: CommunityContractTemplateMetadataAttributes =
      req.body.contractMetadata;

    if (!contractTemplateMetadata) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractTemplateMetadata.findOne({
      where: {
        cct_id: contractTemplateMetadata.cct_id,
      },
    });

    if (!contract) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    await contract.destroy();

    return res.json({ status: 'Success', data: contract });
  } catch (err) {
    throw new AppError('Error deleting community contract template metadata');
  }
}
