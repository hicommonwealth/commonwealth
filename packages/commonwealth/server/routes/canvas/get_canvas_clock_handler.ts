import { AppError } from '@hicommonwealth/core';
// import { ServerControllers } from '../../routing/router';
// import { TypedRequestQuery, TypedResponse } from '../../types';

// type GetStatsResponse = {
//   clock: number;
//   heads: string[];
// };

export const getCanvasClockHandler = () => {
  throw new AppError('Not implemented');
};

// export const getCanvasClockHandler = async (
//   controllers: ServerControllers,
//   req: TypedRequestQuery<{}>,
//   res: TypedResponse<GetStatsResponse>,
// ) => {
//   const [clock, heads] = await canvas.messageLog.getClock();
//
//   return success(res, { clock, heads });
// };
