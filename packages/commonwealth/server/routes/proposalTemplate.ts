import { AppError } from '@hicommonwealth/core';
import type {
  CommunityContractTemplateAttributes,
  CommunityContractTemplateMetadataAttributes,
  DB,
} from '@hicommonwealth/model';
import type { Request, Response } from 'express';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { validateOwner } from '../util/validateOwner';

type CreateCommunityContractTemplateAndMetadataReq = {
  cct_id: string;
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  contract_id: number;
  community_id: number;
  template_id: number;
  chain_id: string;
  enabled_by: string;
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

export async function createCommunityContractTemplateAndMetadata(
  models: DB,
  req: TypedRequestBody<CreateCommunityContractTemplateAndMetadataReq>,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>,
) {
  const {
    slug,
    nickname,
    display_name,
    display_options,
    community_id,
    contract_id,
    template_id,
    chain_id,
    enabled_by,
  } = req.body;

  const isAdmin = await validateOwner({
    models: models,
    user: req.user,
    communityId: chain_id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError('Must be admin');
  }

  if (!community_id || !contract_id || !template_id) {
    throw new AppError(
      'Must provide community_id, contract_id, and template_id',
    );
  }

  if (!slug || !nickname || !display_name || !display_options) {
    throw new AppError(
      'Must provide slug, nickname, display_name, and display_options',
    );
  }

  const communityContract = await models.CommunityContract.findOne({
    where: { contract_id: contract_id, community_id: chain_id },
  });

  if (!communityContract) {
    throw new AppError('Community Contract does not exist');
  }

  // Iterate through all ccts and check if their cctmds have the same slug
  const ccts = await models.CommunityContractTemplate.findAll({
    where: { community_contract_id: communityContract.id },
  });

  for (const cct of ccts) {
    const cctmd = await models.CommunityContractTemplateMetadata.findOne({
      where: { id: cct.cctmd_id },
    });
    if (cctmd.slug === slug) {
      throw new AppError('Slug already exists');
    }
  }

  try {
    // TODO: can some kind of transcation happen here to make this atomic?
    const newMetadata = await models.CommunityContractTemplateMetadata.create({
      slug,
      nickname,
      display_name,
      display_options,
      enabled_by,
    });

    const newCCT = await models.CommunityContractTemplate.create({
      community_contract_id: communityContract.id,
      cctmd_id: newMetadata.id,
      template_id,
    });

    return success(res, { metadata: newMetadata, cct: newCCT });
  } catch (err) {
    console.log('err', err);
    throw new AppError(
      'Unkown Server error creating community contract template',
    );
  }
}

export async function getCommunityContractTemplate(
  models: DB,
  req: TypedRequestBody<CommunityContractTemplateRequest>,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>,
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
  req: TypedRequestBody<CreateCommunityContractTemplateAndMetadataReq>,
  res: TypedResponse<CommunityContractTemplateAndMetadataResp>,
) {
  try {
    if (!req.body) {
      throw new AppError('Must provide community_contract_id and template_id');
    }

    const {
      slug,
      nickname,
      display_name,
      display_options,
      contract_id,
      cct_id,
      chain_id,
    } = req.body;

    const isAdmin = await validateOwner({
      models: models,
      user: req.user,
      communityId: chain_id,
      allowAdmin: true,
      allowSuperAdmin: true,
    });
    if (!isAdmin) {
      throw new AppError('Must be admin');
    }

    if (!contract_id) {
      throw new AppError('Must provide contract_id.');
    }

    if (!slug || !nickname || !display_name || !display_options) {
      throw new AppError(
        'Must provide slug, nickname, display_name, and display_options',
      );
    }

    const communityContractTemplate =
      await models.CommunityContractTemplate.findOne({
        where: { id: cct_id },
      });

    if (!communityContractTemplate) {
      throw new AppError('Failed to find community contract');
    }

    const metadataToUpdate =
      await models.CommunityContractTemplateMetadata.findOne({
        where: { id: communityContractTemplate.cctmd_id },
      });

    if (!metadataToUpdate) {
      throw new AppError('Failed to find metadata to update');
    }

    const updatedMetadata = await metadataToUpdate.update({
      slug,
      nickname,
      display_name,
      display_options,
    });

    return success(res, {
      metadata: updatedMetadata,
      cct: communityContractTemplate,
    });
  } catch (err) {
    console.log(err);
    throw new AppError('Error updating community contract template');
  }
}

export async function deleteCommunityContractTemplate(
  models: DB,
  req: Request,
  res: TypedResponse<
    CommunityContractTemplateAndMetadataResp & {
      deletedContract: boolean;
    }
  >,
) {
  try {
    if (!req.body) {
      throw new AppError('Must provide community_contract_id and template_id');
    }

    const { contract_id, template_id, cctmd_id, chain_id } = req.body;

    const isAdmin = await validateOwner({
      models: models,
      user: req.user,
      communityId: chain_id,
      allowAdmin: true,
      allowSuperAdmin: true,
    });
    if (!isAdmin) {
      throw new AppError('Must be admin');
    }

    const shouldDeleteCommunityContract = req.query.community_contract;
    const contractTemplate: CommunityContractTemplateAttributes = req.body;

    const communityContract = await models.CommunityContract.findOne({
      where: { contract_id, community_id: chain_id },
    });

    const communityContractId = communityContract.id;

    if (shouldDeleteCommunityContract) {
      // Delete CommunityContract and All Associated Templates and Metadata
      const ccts = await models.CommunityContractTemplate.findAll({
        where: { community_contract_id: communityContractId },
      });

      for (const cct of ccts) {
        const metadata = await models.CommunityContractTemplateMetadata.findOne(
          {
            where: { id: cct.cctmd_id },
          },
        );

        if (metadata) {
          await metadata.destroy();
        }

        await cct.destroy();
      }

      await communityContract.destroy();

      return success(res, {
        metadata: null,
        cct: null,
        deletedContract: Boolean(shouldDeleteCommunityContract),
      });
    }

    if (!contractTemplate) {
      throw new AppError('Must provide contract template');
    }

    const communityContractTemplate =
      await models.CommunityContractTemplate.findOne({
        where: {
          template_id,
          community_contract_id: communityContractId,
          cctmd_id,
        },
      });

    if (!communityContractTemplate) {
      // we return success here because the contract template is already deleted
      // this handles the case where the community contract is deleted but the
      // template is not because no template was created for it
      return success(res, {
        metadata: null,
        cct: null,
        deletedContract: Boolean(shouldDeleteCommunityContract),
      });
    }

    const communityContractMetadata =
      await models.CommunityContractTemplateMetadata.findOne({
        where: {
          id: communityContractTemplate.cctmd_id,
        },
      });

    if (!communityContractMetadata) {
      throw new AppError('Contract metadata does not exist');
    }

    // Make a copy of communitycontractmetadata and communitycontracttemplate
    // before deleting them
    const cct = communityContractTemplate;
    const cctmd = communityContractMetadata;

    await communityContractTemplate.destroy();
    await communityContractMetadata.destroy();

    return success(res, {
      metadata: cctmd,
      cct,
      deletedContract: Boolean(shouldDeleteCommunityContract),
    });
  } catch (err) {
    console.log(err);
    throw new AppError('Error deleting community contract template');
  }
}

// TODO: Unclear when necessary
export async function getCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response,
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
  res: Response,
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }

    const isAdmin = await validateOwner({
      models: models,
      user: req.user,
      communityId: req.body.chain_id,
      allowAdmin: true,
      allowSuperAdmin: true,
    });
    if (!isAdmin) {
      throw new AppError('Must be admin');
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
  res: Response,
) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }

    const isAdmin = await validateOwner({
      models: models,
      user: req.user,
      communityId: req.body.chain_id,
      allowAdmin: true,
      allowSuperAdmin: true,
    });
    if (!isAdmin) {
      throw new AppError('Must be admin');
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
