import { client } from 'server/federation';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

export const getCanvasClockHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<{}>,
  res: TypedResponse<{ clock: number; heads: string[] }>,
) => {
  const { clock, heads } = await client.getClock();

  return success(res, { clock, heads });
};
