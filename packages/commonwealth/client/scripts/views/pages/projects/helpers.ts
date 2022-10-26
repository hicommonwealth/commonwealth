import { AddressInfo, Project } from 'models';
import BN from 'bn.js';
import Web3 from 'web3';
import { ProjectRole } from './types';

// Creation
export const validateProjectForm = (property: string, value: string) => {
  if (!value)
    return [
      'failure',
      `Form is missing a ${property.split(/(?=[A-Z])/)} input.`,
    ];
  let errorMessage: string;
  switch (property) {
    case 'title':
      if (value.length < 8 || value.length > 64) {
        errorMessage = `Title must be valid string between 3 and 64 characters. Current count: ${value.length}`;
      }
      break;
    case 'shortDescription':
      if (value.length > 224) {
        errorMessage = `Input limit is 224 characters. Current count: ${value.length}`;
      }
      break;
    case 'token':
    case 'beneficiary':
    case 'creator':
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

/* TEST CREATION */
/* <CWButton
  label='Create Project'
  onclick={async () => {
    const [txReceipt, newProjectId] = await app.projects.createProject({
      beneficiary: '0x0E16433c002cD68e5E718187f694D30d5f929D5f',
      chainId: 'ethereum',
      coverImage:
        'https://commonwealth-uploads.s3.us-east-2.amazonaws.com/b1e3b3f9-67d8-43a3-be80-e9f038da415f.jpeg',
      creator: '0xDaB156b7F2aFcBE63301eB2C81941703b808B28C',
      curatorFee: 5,
      deadline: 1000000,
      description:
        '{'ops':[{'insert':'This is the general description field.\\n'}]}',
      shortDescription: 'This is my short description',
      threshold: 100,
      title: 'Project title',
      token: '0x11eF819024de53671633cC27AA65Fd354d783178',
    });
    console.log({ txReceipt, newProjectId });
  }}
/> */

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
