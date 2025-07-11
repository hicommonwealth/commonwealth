import { models } from '@hicommonwealth/model/db';
import { UserAttributes } from '@hicommonwealth/model/models';
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

type UserBuilder = { userAttributes: UserAttributes };

export function buildUser(userBuilder: UserBuilder): Express.User {
  return {
    ...userBuilder.userAttributes,
    getAddresses: () =>
      models.Address.findAll({
        where: { user_id: userBuilder.userAttributes.id },
      }),
  } as Express.User;
}

export function res<T>(): TypedResponse<T> {
  return { json: <R>(r: R) => r } as any as TypedResponse<T>;
}
