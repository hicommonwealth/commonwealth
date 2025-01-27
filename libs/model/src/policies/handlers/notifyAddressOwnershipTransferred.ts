import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { ZodBoolean } from 'zod';
import { models } from '../../database';

export const notifyAddressOwnershipTransferred: EventHandler<
  'AddressOwnershipTransferred',
  ZodBoolean
> = async ({ payload }) => {
  // TODO: should we ignore when old_user_email is null?
  if (!payload.old_user_email) return true;

  const community = await models.Community.findOne({
    where: { id: payload.community_id },
  });
  if (!community) return false;

  const provider = notificationsProvider();
  const res = await provider.triggerWorkflow({
    key: WorkflowKeys.AddressOwnershipTransferred,
    users: [{ id: String(payload.old_user_id) }],
    data: {
      community_id: payload.community_id,
      community_name: community.name,
      address: payload.address,
      user_id: payload.user_id,
      old_user_id: payload.old_user_id,
      old_user_email: payload.old_user_email,
      created_at: payload.created_at.toISOString(),
    },
  });

  return !res.some((r) => r.status === 'rejected');
};

// TODO: create knock workflow for this
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
