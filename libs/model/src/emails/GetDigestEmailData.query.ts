import {
  ExternalServiceUserIds,
  GetDigestEmailData,
  Query,
} from '@hicommonwealth/core';

export function GetDigestEmailDataQuery(): Query<typeof GetDigestEmailData> {
  return {
    ...GetDigestEmailData,
    auth: [],
    secure: true,
    authStrategy: { name: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async ({ payload }) => {
      return {};
    },
  };
}
