import { AppError } from 'common-common/src/errors';
import type { Request, Response } from 'express';
import type { DB } from '../models';
import type { CommunityContractTemplateAttributes } from '../models/community_contract_template';
import type { CommunityContractTemplateMetadataAttributes } from '../models/community_contract_metadata';
import type {
  TypedRequestBody,
  TypedRequestQuery,
  TypedResponse,
} from '../types';
import { success, failure } from '../types';

type CreateCommunityContractTemplateAndMetadataReq = {
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  community_id: string;
  contract_id: number;
  template_id: number;
};

type CommunityContractTemplateAndMetadataResp = {
  metadata: CommunityContractTemplateMetadataAttributes;
  cct: CommunityContractTemplateAttributes;
};

type CommunityContractTemplateRequest = {
  id: number;
  community_contract_id: number;
  cctmd_id: number;
  template_id: number;
};

type CommunityContractTemplateResp = {
  community_contract_id: number;
  template_id: number;
};

export async function createCommunityContractTemplateAndMetadata(
  models: DB,
  req: TypedRequestBody<CreateCommunityContractTemplateAndMetadataReq>,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>
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

  const communityContract = await models.CommunityContract.findOne({
    where: { id: contract_id },
  });

  if (!communityContract) {
    throw new AppError('Failed to create community contract');
  }

  try {
    // TODO: can some kind of transcation happen here to make this atomic?
    const newMetadata = await models.CommunityContractTemplateMetadata.create({
      slug,
      nickname,
      display_name,
      display_options,
    });

    const newCCT = await models.CommunityContractTemplate.create({
      community_contract_id: communityContract.id,
      template_id,
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
  req: TypedRequestBody<CommunityContractTemplateRequest>,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>
) {
  try {
    if (!req.body) {
      throw new AppError('Must provide community_contract_id and template_id');
    }
    const contractTemplate: CommunityContractTemplateAttributes = req.body;

    if (!contractTemplate) {
      throw new AppError('Must provide contract template');
    }

    const communityContract = await models.CommunityContractTemplate.findOne({
      where: {
        template_id: contractTemplate.template_id,
      },
    });

    if (!communityContract) {
      throw new AppError('Contract does not exist');
    }

    const metadata = await models.CommunityContractTemplateMetadata.findOne({
      where: {
        id: communityContract.cctmd_id,
      },
    });

    if (!metadata) {
      throw new AppError('Metadata does not exist');
    }

    const cct = await models.CommunityContractTemplate.findOne({
      where: {
        community_contract_id: contractTemplate.community_contract_id,
        template_id: contractTemplate.template_id,
      },
    });

    if (!cct) {
      throw new AppError('Contract template does not exist');
    }

    return success(res, {
      metadata,
      cct,
    });
  } catch (err) {
    throw new AppError('Error getting community contract template');
  }
}

export async function updateCommunityContractTemplate(
  models: DB,
  req: TypedRequestBody<CommunityContractTemplateRequest>,
  res: TypedResponse<CommunityContractTemplateResp>
) {
  try {
    if (!req.body) {
      throw new AppError('Must provide community_contract_id and template_id');
    }

    const contractTemplate: CommunityContractTemplateAttributes = req.body;

    if (!contractTemplate) {
      throw new AppError('Must provide contract template');
    }

    const contract = await models.CommunityContractTemplate.findOne({
      where: {
        template_id: contractTemplate.template_id,
      },
    });

    if (!contract) {
      throw new AppError('Contract does not exist');
    }

    const updated = await contract.update(contractTemplate);

    return success(res, {
      community_contract_id: updated.community_contract_id,
      template_id: updated.template_id,
    });
  } catch (err) {
    throw new AppError('Error updating community contract template');
  }
}

export async function deleteCommunityContractTemplate(
  models: DB,
  req: Request,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>
) {
  try {
    if (!req.body) {
      throw new AppError('Must provide community_contract_id and template_id');
    }

    const { contract_id, template_id } = req.body;

    const shouldDeleteCommunityContract = req.query.community_contract;
    const contractTemplate: CommunityContractTemplateAttributes = req.body;

    if (!contractTemplate) {
      throw new AppError('Must provide contract template');
    }

    const communityContractTemplate =
      await models.CommunityContractTemplate.findOne({
        where: { template_id },
      });

    if (!communityContractTemplate) {
      throw new AppError('Contract does not exist');
    }

    const communityContractMetadata =
      await models.CommunityContractTemplateMetadata.findOne({
        where: {
          id: contractTemplate.cctmd_id,
        },
      });

    if (!communityContractMetadata) {
      throw new AppError('Contract metadata does not exist');
    }

    if (shouldDeleteCommunityContract) {
      const communityContract = await models.CommunityContract.findOne({
        where: { id: contract_id },
      });
      await communityContract.destroy();
    }

    await communityContractTemplate.destroy();
    await communityContractMetadata.destroy();

    return success(res, {
      metadata: communityContractMetadata,
      cct: communityContractTemplate,
    });
  } catch (err) {
    throw new AppError('Error deleting community contract template');
  }
}

// TODO: Unclear when necessary
export async function getCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    const { id } = req.body.contractMetadata;
    if (!id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide id',
      });
    }

    const contract = await models.CommunityContractTemplateMetadata.findOne({
      where: {
        id,
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
        id: contractTemplateMetadata.id,
      },
    });

    // TODO: Actually update the data

    const cct = await models.CommunityContractTemplate.findOne({
      where: {
        cctmd_id: contract.id,
      },
    });

    if (!contract || !cct) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Template not found',
      });
    }

    return res.json({ status: 'Success', data: { cctmd: contract, cct } });
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
        id: contractTemplateMetadata.id,
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
