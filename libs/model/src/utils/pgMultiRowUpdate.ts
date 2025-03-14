import { QueryTypes, Transaction } from 'sequelize';
import { models } from '../database';

export async function pgMultiRowUpdate(
  tableName: string,
  columns: {
    setColumn: string;
    rows: { newValue: string | number; whenCaseValue: string | number }[];
  }[],
  caseColumn: string,
  transaction?: Transaction,
) {
  if (columns.length === 0) return false;

  let updates = ``;
  for (const { setColumn, rows } of columns) {
    if (updates.length > 0) updates += `, \n`;
    updates += `${setColumn} = CASE \n${rows
      .map(
        ({ whenCaseValue, newValue }) =>
          `WHEN ${caseColumn} = ${whenCaseValue} THEN ${newValue}`,
      )
      .join('\n')}`;
    updates += ` \nEND`;
  }

  const caseValues = new Set(
    columns.map((c) => c.rows.map((r) => r.whenCaseValue)).flat(),
  );
  const query = `
      UPDATE "${tableName}"
      SET ${updates}
      WHERE ${caseColumn} IN (${Array.from(caseValues).join(', ')});
  `;

  await models.sequelize.query(query, { transaction, type: QueryTypes.UPDATE });
  return true;
}
