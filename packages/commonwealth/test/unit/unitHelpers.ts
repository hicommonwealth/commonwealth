import type { DB, UserAttributes } from '@hicommonwealth/model';
import type {
  TypedRequestBody,
  TypedRequestQuery,
  TypedResponse,
} from 'server/types';

// We don't care about express internals when performing unit tests,
// so we just cast it to avoid typescript from complaining
const expressRequest = {} as any as Express.Request;

export function getReq<
  T extends Record<string, unknown> = Record<string, unknown>,
>(r: T): TypedRequestQuery<T> {
  return { query: r, ...expressRequest };
}

export function postReq<
  T extends Record<string, unknown> = Record<string, unknown>,
>(r: T, userBuilder?: UserBuilder): TypedRequestBody<T> {
  let resp = {
    body: r,
    ...expressRequest,
  };

  if (userBuilder) resp = { ...resp, user: buildUser(userBuilder) };

  return resp;
}

type UserBuilder = { models: DB; userAttributes: UserAttributes };

export function buildUser(userBuilder: UserBuilder): Express.User {
  return {
    ...userBuilder.userAttributes,
    getAddresses: () =>
      userBuilder.models.Address.findAll({
        where: { user_id: userBuilder.userAttributes.id },
      }),
  } as Express.User;
}

export function res<T>(): TypedResponse<T> {
  return { json: <R>(r: R) => r } as any as TypedResponse<T>;
}
