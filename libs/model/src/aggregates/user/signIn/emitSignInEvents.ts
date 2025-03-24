import * as schemas from '@hicommonwealth/schemas';
import { Op, Transaction } from 'sequelize';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
import { emitEvent } from '../../../utils/utils';

export async function emitSignInEvents(
  triggers: { newAddress: boolean; newUser: boolean; transferredUser: boolean },
  addressInstance: AddressAttributes,
  user: UserAttributes,
  transaction: Transaction,
  originalAddressOwnerUserId?: number,
) {
  const { community_id, address, created_at, wallet_id } = addressInstance;
  const { referred_by_address: referrer_address } = user;
  const events = [] as Array<schemas.EventPairs>;

  if (triggers.newAddress) {
    events.push({
      event_name: 'CommunityJoined',
      event_payload: {
        community_id,
        user_id: user.id!,
        referrer_address,
        created_at: created_at!,
      },
    });

    // check if this is a new wallet
    const existingWallet = await models.Address.findOne({
      where: { user_id: user.id, wallet_id, address: { [Op.ne]: address } },
    });
    if (!existingWallet) {
      events.push({
        event_name: 'WalletLinked',
        event_payload: {
          user_id: user.id!,
          new_user: triggers.newUser,
          wallet_id: wallet_id!,
          community_id,
          created_at: created_at!,
        },
      });
    }
  }

  if (triggers.newUser)
    events.push({
      event_name: 'UserCreated',
      event_payload: {
        community_id,
        address,
        user_id: user.id!,
        created_at: created_at!,
        referrer_address,
      },
    });

  if (triggers.transferredUser && originalAddressOwnerUserId) {
    const originalOwner = await models.User.findByPk(
      originalAddressOwnerUserId,
    );
    events.push({
      event_name: 'AddressOwnershipTransferred',
      event_payload: {
        community_id,
        address,
        user_id: user.id!,
        old_user_id: originalAddressOwnerUserId,
        old_user_email: originalOwner?.email,
        created_at: new Date(),
      },
    });
  }

  await emitEvent(models.Outbox, events, transaction);
}
