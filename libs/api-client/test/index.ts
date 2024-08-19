// Quick and dirty api-client test
import { CommunityApi, Configuration } from '@hicommonwealth/api-client';

async function main() {
  const config = new Configuration({
    accessToken: '',
    basePath: 'http://localhost:8080/api/v1',
  });

  const client = new CommunityApi(config);
  const members = await client.getMembers(
    'sushi',
    undefined,
    10,
    1,
    'last_active',
    'DESC',
    undefined,
    true,
  );
  console.log(members.data.results);
}

void main();
