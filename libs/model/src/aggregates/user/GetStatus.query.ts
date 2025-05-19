import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function GetStatus(): Query<typeof schemas.GetStatus> {
  return {
    ...schemas.GetStatus,
    auth: [],
    secure: false, // TODO: this should be secure
    body: async ({ actor }) => {
      const user = await models.User.findByPk(actor.user.id);
      mustExist('User', user);

      const addresses = await models.Address.findAll({
        where: { user_id: user.id },
        attributes: [
          'id',
          'address',
          'role',
          'wallet_id',
          'oauth_provider',
          'ghost_address',
          'last_active',
        ],
        include: [
          {
            required: true,
            model: models.Community,
            attributes: ['id', 'base', 'ss58_prefix'],
            where: { active: true },
          },
        ],
      });

      const communities = await models.sequelize.query<
        z.infer<typeof schemas.UserStatusCommunityView>
      >(
        `
      SELECT
        c.id, c.name, c.icon_url,
        CASE
          WHEN sc.community_id IS NOT NULL THEN TRUE
          ELSE FALSE
        END AS is_starred,
        c.redirect
      FROM
        "Communities" c
        JOIN "Addresses" a ON c.id = a.community_id and a.user_id = :user_id
        LEFT JOIN "StarredCommunities" sc ON c.id = sc.community_id AND sc.user_id = :user_id
      WHERE
        c.active = true;
      `,
        {
          replacements: { user_id: user.id },
          type: QueryTypes.SELECT,
        },
      );

      return {
        id: user.id!,
        tier: user.tier,
        email: user.email,
        emailVerified: user.emailVerified,
        emailInterval: user.emailNotificationInterval,
        promotional_emails_enabled: user.promotional_emails_enabled,
        is_welcome_onboard_flow_complete: user.is_welcome_onboard_flow_complete,
        selected_community_id: user.selected_community_id,
        isAdmin: user.isAdmin,
        disableRichText: user.disableRichText,
        referred_by_address: user.referred_by_address,
        xp_points: user.xp_points,
        xp_referrer_points: user.xp_referrer_points,
        addresses: (addresses || []).map((a) => a.toJSON()) as Array<
          z.infer<typeof schemas.UserStatusAddressView>
        >,
        communities: communities || [],
      };
    },
  };
}
