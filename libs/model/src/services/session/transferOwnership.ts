import * as schemas from '@hicommonwealth/schemas';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export const Errors = {
  InvalidCommunity: 'Invalid community',
  InvalidAddress: 'Invalid address',
  NoChain: 'Must provide chain',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
  InvalidArguments: 'Invalid arguments',
  BadSecret: 'Invalid jwt secret',
  BadToken: 'Invalid sign in token',
  WrongWallet: 'Verified with different wallet than created',
};

/**
 * Reassigns user to unverified addresses = "transfer ownership".
 * TODO: @timolegros - check if we can transfer verified addresses, when user signs in with two different wallets (two users) and we want to
 * consolidate them into one user.
 */
export async function transferOwnership(
  addr: z.infer<typeof schemas.Address>,
  transaction: Transaction,
) {
  const unverifed = await models.Address.findOne({
    where: {
      address: addr.address,
      user_id: { [Op.ne]: addr.user_id },
      verified: { [Op.ne]: null },
    },
    include: {
      model: models.User,
      required: true,
      attributes: ['id', 'email'],
    },
    transaction,
  });
  const [updated] = await models.Address.update(
    { user_id: addr.user_id },
    {
      where: {
        address: addr.address,
        user_id: { [Op.ne]: addr.user_id },
        verified: { [Op.ne]: null },
      },
      transaction,
    },
  );
  // TODO: should only ever be one user (but we are updating all)
  return updated > 0 && unverifed ? unverifed.User : undefined;

  // TODO: subscribe to AddressOwnershipTransferred event
  // if (updated > 0 && unverifed) {
  //   try {
  //     // send email to the old user (should only ever be one)
  //     if (!unverifed.User?.email) throw new InvalidState(Errors.NoEmail);

  //     const msg = {
  //       to: unverifed.User.email,
  //       from: `Commonwealth <no-reply@${PRODUCTION_DOMAIN}>`,
  //       templateId: DynamicTemplate.VerifyAddress,
  //       dynamic_template_data: {
  //         address: addr.address,
  //         chain: community.name,
  //       },
  //     };
  //     await sgMail.send(msg);
  //     log.info(
  //       `Sent address move email: ${addr.address} transferred to a new account`,
  //     );
  //   } catch (e) {
  //     log.error(
  //       `Could not send address move email for: ${addr.address}`,
  //       e as Error,
  //     );
  //   }
  // }
}

// TODO: this can be deprecated since it's implemented in the signin command
// /**
//  * Processes an address, verifying the session signature and transferring ownership
//  * to the user if necessary.
//  * @param community community instance
//  * @param address address to verify
//  * @param wallet_id wallet id
//  * @param session session to verify
//  * @param user user to assign ownership to
//  * @returns updated address instance
//  */
// export async function processAddress(
//   community: z.infer<typeof schemas.Community>,
//   address: string,
//   wallet_id: WalletId,
//   session: Session,
//   user?: User,
// ): Promise<z.infer<typeof schemas.Address>> {
//   const addr = await models.Address.scope('withPrivateData').findOne({
//     where: { community_id: community.id, address },
//     include: [
//       {
//         model: models.Community,
//         required: true,
//         attributes: ['ss58_prefix'],
//       },
//     ],
//   });
//   if (!addr) throw new InvalidInput(Errors.AddressNF);
//   if (addr.wallet_id !== wallet_id) throw new InvalidInput(Errors.WrongWallet);
//   // check whether the token has expired
//   // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
//   const expiration = addr.verification_token_expires;
//   if (expiration && +expiration <= +new Date())
//     throw new InvalidInput(Errors.ExpiredToken);

//   // Verify the signature matches the session information = verify ownership
//   // IMPORTANT: A new user is created if none exists for this address!
//   try {
//     return await sequelize.transaction(async (transaction) => {
//       const updated = await verifySessionSignature(
//         session,
//         addr,
//         transaction,
//         user?.id,
//       );
//       await transferOwnership(updated, community, transaction);
//       return updated.toJSON();
//     });
//   } catch {
//     log.warn(`Failed to verify signature for ${address}`);
//     throw new InvalidInput(Errors.InvalidSignature);
//   }
// }
