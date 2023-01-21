import { AppError } from 'common-common/src/errors';
import { Request, Response } from 'express';
import { DB } from '../models';
import { CommunityContractTemplateAttributes } from '../models/community_contract_template';

export async function createCommunityContractTemplate(
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

    const contractTemplate: CommunityContractTemplateAttributes = req.body.contract;
    if (!contractTemplate) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const created = await models.CommunityContractTemplate.create(contractTemplate);

    return res.json({ status: 'Success', created });
  } catch (err) {
    console.log({ err });
    throw new AppError('Error creating community contract template');
  }
}

export async function getCommunityContractTemplate(
  models: DB,
  req: Request,
  res: Response
) {
  try {
    const { community_id, contract_id } = req.body.contract;
    if (!community_id || !contract_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id and contract_id',
      });
    }

    const result = await models.sequelize.query(
      `SELECT * FROM CommunityContractTemplate 
      WHERE community_id = :community_id AND contract_id = :contract_id`
    );

    return res.json({ status: 'Success', result });
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

    const { community_id, contract_id, template_id } = req.body.contract;
    if (!community_id || !contract_id || !template_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id, contract_id, and template_id',
      });
    }

    const result = await models.sequelize.query(
      `UPDATE CommunityContractTemplate SET
      community_id = :community_id, 
      contract_id = :contract_id, 
      template_id = :template_id
      WHERE community_id = :community_id AND contract_id = :contract_id`
    );

    return res.json({ status: 'Success', result });
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
    const { community_id, contract_id } = req.body.contract;
    if (!community_id || !contract_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide community_id and contract_id',
      });
    }

    const result = await models.sequelize.query(
      `DELETE FROM CommunityContractTemplate 
      WHERE community_id = :community_id AND contract_id = :contract_id`
    );

    return res.json({ status: 'Success', result });
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
    if (!req.body) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide contract template metadata',
      });
    }
    const { cct_id, slug, nickname, display_name, display_options } =
      req.body.contract;
    if (!cct_id || !slug || !nickname || !display_name || !display_options) {
      return res.status(400).json({
        status: 'Failure',
        message:
          'Must provide cct_id, slug, nickname, display_name, and display_options',
      });
    }

    const result = await models.sequelize.query(
      `INSERT INTO CommunityContractTemplateMetadata (
      cct_id,
      slug,
      nickname,
      display_name,
      display_options
    ) VALUES (:cct_id, :slug, :nickname, :display_name, :display_options)`
    );

    return res.json({ status: 'Success', result });
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
    const { cct_id } = req.body.contract;
    if (!cct_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide cct_id',
      });
    }

    const result = await models.sequelize.query(
      `SELECT * FROM CommunityContractTemplateMetadata 
      WHERE cct_id = :cct_id`
    );

    return res.json({ status: 'Success', result });
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
    const {
      cct_id,
      slug,
      nickname,
      display_name,
      display_options
    } = req.body.contract;

    if (!cct_id || !slug || !nickname || !display_name || !display_options) {
      return res.status(400).json({
        status: 'Failure',
        message:
          'Must provide cct_id, slug, nickname, display_name, and display_options',
      });
    }

    const result = await models.sequelize.query(
      `UPDATE CommunityContractTemplateMetadata SET
      cct_id = :cct_id,
      slug = :slug,
      nickname = :nickname,
      display_name = :display_name,
      display_options = :display_options
      WHERE cct_id = :cct_id`
    );

    return res.json({ status: 'Success', result });
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
    const { cct_id } = req.body.contract;
    if (!cct_id) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Must provide cct_id',
      });
    }

    const result = await models.sequelize.query(
      `DELETE FROM CommunityContractTemplateMetadata 
      WHERE cct_id = :cct_id`
    );

    return res.json({ status: 'Success', result });
  } catch (err) {
    throw new AppError('Error deleting community contract template metadata');
  }
}
