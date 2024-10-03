// Quick and dirty api-client test
import { CommonApiClient } from '@hicommonwealth/api-client';

async function main() {
  const client = new CommonApiClient({
    apiKey: '',
    address: '',
  });
  const members = await client.community.getMembers({
    communityId: 'sushi',
    limit: '10',
    cursor: '1',
    orderBy: 'last_active',
    orderDirection: 'DESC',
    includeRoles: true,
  });
  console.log(members);
}

void main();
