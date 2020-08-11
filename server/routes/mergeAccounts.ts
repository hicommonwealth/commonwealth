import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';


import Keyring from '@polkadot/keyring';
import { stringToU8a, u8aToHex, hexToU8a } from '@polkadot/util';


import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
import role from '../models/role';

export const Errors = {
  AddressesNotOwned: 'User does not own both addresses',
  NeedSignature: 'Must provide signature',
  InvalidSignature: 'Signature is invalid',
};

const validateSignature = async (address, signature, message) => {
  if (address.chain === 'edgeware'
  //  || address.chain === 'kusama' // commented bc untested but should work;
  //  || address.chain === 'polkadot'
  ) {
    const ss58Format = address.chain === 'edgeware' ? 7
      : address.chain === 'kusama' ? 2
        : address.chain === 'polkadot' ? 0 : NaN;
    const signatureU8a = signature.slice(0, 2) === '0x'
      ? hexToU8a(signature)
      : hexToU8a(`0x${signature}`);
    const keyring1 = new Keyring({
      type: 'sr25519',
      ss58Format,
    }).addFromAddress(address.address);
    const valid = keyring1.verify(stringToU8a(message), signatureU8a);
    if (valid) return true;
    // if it fails, check if it's a keyring type issue
    const keyring2 = await (new Keyring({
      type: 'ed25519',
      ss58Format,
    })).addFromAddress(address.address);
    return keyring2.verify(stringToU8a(message), signatureU8a);
  } else if (address.chain === 'ethereum') {
    return false;
  }
  return false;
};

const mergeAccounts = async (models, req: Request, res: Response, next: NextFunction) => {
  const { oldAddress, newAddress, signature, message } = req.body;

  if (!signature) return next(new Error(Errors.NeedSignature));

  // get User model with Addresses
  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    },
    include: [ { model: models.Address, }, ],
  });

  // Check addresses are owned by User
  const { Addresses } = user;
  const userAddresses = Addresses.map((a) => a.address);
  if (!userAddresses.includes(oldAddress) || !userAddresses.includes(newAddress)) {
    return next(new Error(Errors.AddressesNotOwned));
  }

  // Get "To be merged" Address Model with its Profile
  const addressToBeMerged = await models.Address.findOne({
    where: {
      address: oldAddress,
      user_id: user.id,
    },
    include: [
      { model: models.OffchainProfile, },
    ],
  });

  const chain = await models.Chain.findOne({
    where: {
      id: addressToBeMerged.chain,
    },
  });

  // verify signature

  try {
    const verified = await validateSignature(addressToBeMerged, signature, message);
    if (!verified) return next(new Error(Errors.InvalidSignature));
  } catch {
    return next(new Error(Errors.InvalidSignature));
  }

  // Get threads to be transfered
  const threadsToBeMerged = await models.OffchainThread.findAll({
    where: {
      address_id: addressToBeMerged.id,
    },
  });

  // Get comments to be transfered
  const commentsToBeMerged = await models.OffchainComment.findAll({
    where: {
      address_id: addressToBeMerged.id,
    },
  });

  // Get reactions to be transfered
  const reactionsToBeMerged = await models.OffchainReaction.findAll({
    where: {
      address_id: addressToBeMerged.id,
    },
  });

  // Get roles to be transfered
  const rolesToBeMerged = await models.Role.findAll({
    where: {
      address_id: addressToBeMerged.id,
    },
  });

  // Get Address to be new owner
  const addressToBeOwner = await models.Address.findOne({
    where: {
      address: newAddress,
      user_id: user.id,
    },
    include: [
      { model: models.OffchainProfile, },
      { model: models.Role, },
    ],
  });

  // Transfer Threads
  await Promise.all(
    threadsToBeMerged.map((thread) => {
      return thread.update({
        address_id: addressToBeOwner.id,
      });
    }),
  );

  // Transfer Comments
  await Promise.all(
    commentsToBeMerged.map((comment) => {
      return comment.update({
        address_id: addressToBeOwner.id,
      });
    }),
  );

  // Transfer Reactions
  await Promise.all(
    reactionsToBeMerged.map((reaction) => {
      return reaction.update({
        address_id: addressToBeOwner.id,
      });
    }),
  );

  // Prune Reactions (doubled on object)
  const allReactions = await models.OffchainReaction.findAll({
    where: {
      address_id: addressToBeOwner.id,
    }
  });


  for (let i=0; i<allReactions.length-1; i++) {
    const reaction1 = allReactions[i];
    for (let j=i+1; j<allReactions.length; j++) {
      const reaction2 = allReactions[j];
      if ((reaction1.proposal_id && reaction1.proposal_id === reaction2.proposal_id)
                || (reaction1.thread_id && reaction1.thread_id === reaction2.thread_id)
                || (reaction1.comment_id && reaction1.comment_id === reaction2.comment_id)
      ) {
        await reaction2.destroy();
      }
    }
  }

  // Transfer and prune roles
  const compare = (role1, role2) => {
    if (role1.permission === 'admin'
            || (role1.permission === 'moderator' && role2.permission !== 'admin')
    ) {
      return [role2.destroy(), role1.update({ address_id: addressToBeOwner.id })];
    } else if (role2.permission === 'admin'
            || (role2.permission === 'moderator' && role1.permission !== 'admin')
    ) {
      return role1.destroy();
    }
  };

  const alreadyOwnedRoles = await models.Role.findAll({
    where: {
      address_id: addressToBeOwner.id,
    },
  });
  const alreadyOwnedChains = alreadyOwnedRoles.map((r) => r.chain_id ? r.chain_id : null);
  const alreadyOwnedComms = alreadyOwnedRoles.map((r) => r.offchain_community_id ? r.offchain_community_id : null);

  await Promise.all(
    rolesToBeMerged.map((role) => {
      if (role.chain_id && alreadyOwnedChains.includes(role.chain_id)) {
        // it's included! check hierarchy and destory one of them.
        const roleTwo = alreadyOwnedRoles.find((r) => r.chain_id === role.chain_id);
        return compare(role, roleTwo);
      } else if (role.offchain_community_id && alreadyOwnedComms.includes(role.offchain_community_id)) {
        const role2 = alreadyOwnedRoles.find((r) => r.offchain_community_id === role.offchain_community_id);
        return compare(role, role2);
      } else {
        return role.update({ address_id: addressToBeOwner.id, });
      }
    }),
  );

  // TODO: What to do with the old Offchain Profile?
  // Keep Address and Offchain Profile in DB, but unassociate with User?
  // Just leave profile page empty (no comments/threads/reactions)?

  return res.json({ status: 'Success', });
};

export default mergeAccounts;
