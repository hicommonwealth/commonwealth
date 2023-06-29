import { Op, QueryTypes } from 'sequelize';

/**
 * This function is used to filter subscriptions that are associated with specific addresses. If an address should be
 * included then all subscriptions that are associated with the user who owns the address will be included. The opposite
 * is true for excludedAddresses.
 */
export async function filterAddresses(
  models,
  findOptions: { [Op.and]: any[] },
  includedAddresses: string[],
  excludedAddresses: string[]
) {
  const query = `
        SELECT DISTINCT user_id
        FROM "Addresses"
        WHERE address IN (?);
      `;
  // currently excludes override includes, but we may want to provide the option for both
  if (excludedAddresses && excludedAddresses.length > 0) {
    const ids = <number[]>(<unknown>await models.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: excludedAddresses,
    }));
    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.notIn]: ids } });
    }
  } else if (includedAddresses && includedAddresses.length > 0) {
    const ids = <number[]>(<unknown>await models.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: includedAddresses,
    }));

    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.in]: ids } });
    }
  }
  return findOptions;
}
