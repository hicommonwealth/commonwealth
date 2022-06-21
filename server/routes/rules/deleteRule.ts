import { DB } from '../../database';
import { AppError, ServerError } from '../../util/errors';
import validateRoles from '../../util/validateRoles';
import { TypedResponse, success, TypedRequestBody } from '../../types';

export const Errors = {
  AdminOnly: 'Only admin can delete rules',
  NoRuleFound: 'No rule was found with specified id',
};

type DeleteRuleReq = { rule_id: number; chain_id: string; };
type DeleteRuleResp = Record<string, never>;

const deleteRule = async (
  models: DB,
  req: TypedRequestBody<DeleteRuleReq>,
  res: TypedResponse<DeleteRuleResp>
) => {
  const isAdmin = validateRoles(models, req.user, 'admin', req.body.chain_id);
  if (!isAdmin) {
    throw new AppError(Errors.AdminOnly);
  }

  try {
    const nRowsDeleted = await models.Rule.destroy({
      where: { id: req.body.rule_id }
    });
    if (nRowsDeleted === 0) {
      throw new AppError(Errors.NoRuleFound)
    }
    return success(
      res,
      {},
    );
  } catch (err) {
    throw new ServerError(err);
  }
};

export default deleteRule;
