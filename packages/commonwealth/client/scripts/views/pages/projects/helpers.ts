import { IApp } from 'state';
import { AddressInfo, ChainInfo, Project } from 'models';
import BN from 'bn.js';
import Web3 from 'web3';
import { CreateProjectKey, ProjectRole } from './types';
import { ChainBase } from '../../../../../../common-common/src/types';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';

// Creation
export const getAllEthChains = (app: IApp): ChainInfo[] => {
  return app.config.chains
    .getAll()
    .filter((c) => c.base === ChainBase.Ethereum);
};

export const getUserEthChains = (app: IApp): ChainInfo[] => {
  const userRoleChainIds = app.roles.roles
    .map((r) => r.chain_id)
    .sort((a, b) => a.localeCompare(b));
  return getAllEthChains(app).filter((c) => userRoleChainIds.includes(c.id));
};

export const validateProjectForm = (
  property: CreateProjectKey,
  value: string
): [ValidationStatus, string] => {
  if (!value)
    return [
      'failure',
      `Form is missing a ${property.split(/(?=[A-Z])/)} input.`,
    ];
  let errorMessage: string;
  switch (property) {
    case 'title':
      if (value.length < 8 || value.length > 64) {
        errorMessage = `Title must be valid string between 8 and 64 characters. Current count: ${value.length}`;
      }
      break;
    case 'shortDescription':
      if (value.length > 224) {
        errorMessage = `Input limit is 224 characters. Current count: ${value.length}`;
      }
      break;
    case 'beneficiary' || 'creator':
      if (!Web3.utils.isAddress(value)) {
        errorMessage = `Invalid ${property} address. Must be a valid Ethereum address.`;
      }
      break;
    case 'fundraiseLength':
      // TODO v2: Min/max fundraiseLength check to accompany more flex raise lengths
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid fundraise length. Must be between [X, Y]';
      }
      break;
    case 'threshold':
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid threshold amount. Must be between [X, Y]';
      }
      break;
    case 'curatorFee':
      if (Number.isNaN(+value) || +value > 100 || +value < 0) {
        errorMessage = `Curator fee must be a valid number (%) between 0 and 100.`;
      }
      break;
    default:
      break;
  }

  if (errorMessage) {
    return ['failure', errorMessage];
  } else {
    return ['success', `Valid ${property}`];
  }
};

// Display

export const getUserRoles = (
  project: Project,
  addresses: AddressInfo[]
): [ProjectRole, BN] => {
  let backingAmount = new BN(0);
  let curatorAmount = new BN(0);
  let isAuthor = false;
  let isCurator = false;
  let isBacker = false;
  for (const address of addresses) {
    const addressInfo: [string, string] = [address.address, address.chain.id];
    if (project.isAuthor(...addressInfo)) {
      isAuthor = true;
    }
    if (project.isCurator(...addressInfo)) {
      isCurator = true;
      curatorAmount = curatorAmount.add(
        project.getCuratedAmount(...addressInfo)
      );
    }
    if (project.isBacker(...addressInfo)) {
      isBacker = true;
      backingAmount = backingAmount.add(
        project.getBackedAmount(...addressInfo)
      );
    }
  }
  if (isAuthor) {
    return [ProjectRole.Author, null];
  } else if (isCurator) {
    return [ProjectRole.Curator, curatorAmount];
  } else if (isBacker) {
    return [ProjectRole.Backer, backingAmount];
  } else {
    return [null, null];
  }
};
