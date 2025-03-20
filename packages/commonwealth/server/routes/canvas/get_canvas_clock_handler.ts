import { AppError } from '@hicommonwealth/core';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse } from '../../types';

type GetStatsResponse = {
  clock: number;
  heads: string[];
};

export const getCanvasClockHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<{}>,
  res: TypedResponse<GetStatsResponse>,
) => {
  throw new AppError('Not implemented');
  // const [clock, heads] = await canvas.messageLog.getClock();
  //
  // return success(res, { clock, heads });
};
