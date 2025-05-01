import { QueryTypes, Transaction } from 'sequelize';
import { models } from '../database';

type Column = {
  setColumn: string;
  rows: { newValue: string | number; whenCaseValue: string | number }[];
};

/**
 * WARNING: NEVER USE WITH USER DERIVED INPUT. All inputs are NOT escaped!
 */
export async function pgMultiRowUpdate(
  tableName: string,
  columns: [Column, ...Column[]],
  caseColumn: string,
  transaction?: Transaction,
  updatedAtColumn?: boolean,
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
  for (const { setColumn, rows } of columns) {
    if (rows.length === 0) continue;
    if (updates.length > 0) updates += `, \n`;

    updates += `${setColumn} = CASE `;
    for (const { whenCaseValue, newValue } of rows) {
      updates += `\n\tWHEN ${caseColumn} = ${whenCaseValue} THEN ${newValue}`;
    }
    updates += ` \n\tEND`;
  }

  const caseValues = new Set(
    columns.map((c) => c.rows.map((r) => r.whenCaseValue)).flat(),
  );
  const query = `
    UPDATE "${tableName}"
    SET ${updates} ${updatedAtColumn ? `, updated_at = NOW()` : ''}
    WHERE ${caseColumn} IN (${Array.from(caseValues).join(', ')});
  `;

  await models.sequelize.query(query, {
    transaction,
    type: QueryTypes.UPDATE,
  });
  return true;
}
