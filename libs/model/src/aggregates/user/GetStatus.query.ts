import { notificationsProvider, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function GetStatus(): Query<typeof schemas.GetStatus> {
  return {
    ...schemas.GetStatus,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const user = await models.User.scope('withPrivateData').findOne({
        where: { id: actor.user.id },
      });
      mustExist('User', user);

      const addresses = await models.Address.findAll({
        where: {
          user_id: user.id,
          wallet_id: { [Op.not]: null },
        },
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
      SELECT DISTINCT
        c.id, c.name, c.icon_url, c.redirect,
        c.created_at, c.updated_at,
        sc.updated_at as starred_at
      FROM
        "Communities" c
        JOIN "Addresses" a ON c.id = a.community_id and a.user_id = :user_id AND a.verified IS NOT NULL
        LEFT JOIN "StarredCommunities" sc ON c.id = sc.community_id AND sc.user_id = :user_id
      WHERE
        c.active = true
      ORDER BY
        sc.updated_at DESC NULLS LAST,
        c.created_at DESC;
      `,
        {
          replacements: { user_id: user.id },
          type: QueryTypes.SELECT,
        },
      );

      const status = {
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

      const jwtToken = jwt.sign({ id: status.id }, config.AUTH.JWT_SECRET, {
        expiresIn: config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      });
      const knockJwtToken = await notificationsProvider().signUserToken(
        status.id,
        config.AUTH.SESSION_EXPIRY_MILLIS / 1000,
      );

      return { ...status, jwt: jwtToken, knockJwtToken };
    },
  };
}
