// Quick and dirty api-client test
import { Configuration, QueryApi } from '@hicommonwealth/api-client';

async function main() {
  const config = new Configuration({
    accessToken: '',
    basePath: 'http://localhost:8080/api/v1/rest',
  });

  const client = new QueryApi(config);
  const members = await client.communityGetMembers(
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
