import { composeSequelizeLogger, logger } from '@hicommonwealth/core';
import { QueryTypes, Transaction } from 'sequelize';
import { config } from '../config';
import { models } from '../database';

const log = logger(import.meta, undefined, config.TWITTER.LOG_LEVEL);

type Column = {
  setColumn: string;
  rows: { newValue: string | number; whenCaseValue: string | number }[];
};

/**
 * Warning: column name is not escaped.
 */
export async function pgMultiRowUpdate(
  tableName: string,
  columns: [Column, ...Column[]],
  caseColumn: string,
  transaction?: Transaction,
) {
  if (columns.length === 0) return false;

  let hasRows = false;
  for (const column of columns) {
    if (column.rows.length > 0) {
      hasRows = true;
      break;
    }
  }
  if (!hasRows) return false;

  let updates = ``;
  const replacements: unknown[] = [];
  for (const { setColumn, rows } of columns) {
    if (rows.length === 0) continue;
    if (updates.length > 0) updates += `, \n`;

    updates += `${setColumn} = CASE `;
    for (const { whenCaseValue, newValue } of rows) {
      updates += `\n\tWHEN ${caseColumn} = ? THEN ?`;
      replacements.push(whenCaseValue, newValue);
    }
    updates += ` \n\tEND`;
  }

  const caseValues = new Set(
    columns.map((c) => c.rows.map((r) => r.whenCaseValue)).flat(),
  );
  const query = `
    UPDATE "${tableName}"
    SET ${updates}
    WHERE ${caseColumn} IN (?);
  `;
  replacements.push(Array.from(caseValues));

  await models.sequelize.query(query, {
    transaction,
    type: QueryTypes.UPDATE,
    logging: composeSequelizeLogger(log, config.TWITTER.LOG_LEVEL),
    replacements,
  });
  return true;
}
