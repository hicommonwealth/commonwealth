import { AppError } from 'common-common/src/errors';
import { Request, Response } from 'express';
import { DB } from '../models';
import { CommunityContractTemplateAttributes } from '../models/community_contract_template';
import { CommunityContractMetadataAttributes } from '../models/community_contract_metadata';

export async function createCommunityContractTemplate(
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

    const created = await models.CommunityContractTemplate.create(
      contractTemplate
    );

    return res.status(201).json({ status: 'Success', data: created });
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

export async function createCommunityContractTemplateMetadata(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    console.log('createCommunityContractTemplateMetadata');
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }

    const contractTemplateMetadata: CommunityContractMetadataAttributes =
      req.body.contractMetadata;

    console.log('contractTemplateMetadata', contractTemplateMetadata);

    if (!contractTemplateMetadata) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const created = await models.CommunityContractMetadata.create(
      contractTemplateMetadata
    );

    return res.status(201).json({ status: 'Success', data: created });
  } catch (err) {
    throw new AppError('Error creating community contract template metadata');
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

    const contract = await models.CommunityContractMetadata.findOne({
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

    const contractTemplateMetadata: CommunityContractMetadataAttributes =
      req.body.contractMetadata;

    if (!contractTemplateMetadata) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractMetadata.findOne({
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

    const contractTemplateMetadata: CommunityContractMetadataAttributes =
      req.body.contractMetadata;

    if (!contractTemplateMetadata) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const contract = await models.CommunityContractMetadata.findOne({
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
