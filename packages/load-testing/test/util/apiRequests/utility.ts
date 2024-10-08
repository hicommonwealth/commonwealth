import http from 'k6/http';

export function createJwts(apiUrl: string, numberOfJwt: number) {
  console.log(`Creating ${numberOfJwt} JWTs...`);
  const url = `${apiUrl}/loadTest.createJWTs`;
  const res = http.post(
    url,
    JSON.stringify({
      id: 0,
      number_of_jwt: String(numberOfJwt),
    }),
    {
      headers: {
        authorization: __ENV.LOAD_TESTING_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  const result = res.json();
  if (res.status !== 200) {
    throw new Error(`Failed to create JWTs: ${JSON.stringify(result)}`);
  }
  return res.json()['result']['data'] as string[];
}
