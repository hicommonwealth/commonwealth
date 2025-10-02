import { logger } from '@hicommonwealth/core';
import { UserTierMap } from '@hicommonwealth/shared';
import { Op, Sequelize } from 'sequelize';
import { models } from '../src/database';

const log = logger(import.meta);

async function backfillReferrerXp() {
  const referredUsers = await models.User.findAll({
    attributes: ['id', 'referred_by_address'],
    where: { referred_by_address: { [Op.ne]: null } },
  });

  const totals = new Map<number, number>();

  for (const user of referredUsers) {
    const refAddr = user.referred_by_address;
    if (!refAddr) continue;

    const ref = await models.Address.findOne({
      attributes: ['user_id'],
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('address')),
            Sequelize.fn('LOWER', refAddr),
          ),
          { user_id: { [Op.not]: null }, is_banned: false },
        ],
      },
      include: [
        {
          model: models.User,
          attributes: ['id'],
          required: true,
          where: { tier: { [Op.ne]: UserTierMap.BannedUser } },
        },
      ],
    });
    const referrerId = ref?.user_id;
    if (!referrerId) continue;

    const logs = await models.XpLog.findAll({
      attributes: ['xp_points', 'creator_xp_points'],
      where: { user_id: user.id },
    });

    let expected = 0;
    for (const logEntry of logs) {
      const reward = logEntry.xp_points + (logEntry.creator_xp_points || 0);
      expected += Math.round(reward * 0.1);
    }
    totals.set(referrerId, (totals.get(referrerId) || 0) + expected);
  }

  for (const [referrerId, total] of totals.entries()) {
    const refUser = await models.User.findOne({
      where: { id: referrerId, tier: { [Op.ne]: UserTierMap.BannedUser } },
      attributes: ['xp_referrer_points'],
    });
    if (!refUser) continue;
    const current = refUser.xp_referrer_points || 0;
    const missing = total - current;
    if (missing > 0) {
      await models.User.increment(
        { xp_points: missing, xp_referrer_points: missing },
        { where: { id: referrerId } },
      );
      log.info(`Credited ${missing} XP to referrer ${referrerId}`);
    }
  }
}

backfillReferrerXp()
  .then(() => {
    log.info('Referrer XP backfill complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
