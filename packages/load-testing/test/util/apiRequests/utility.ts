import http from 'k6/http';

export function createJwts(apiUrl: string, numberOfJwt: number) {
  console.log(`Creating ${numberOfJwt} JWTs...`);
  const res = http.post(
    `${apiUrl}/loadtest/k6/CreateJWTs`,
    JSON.stringify({
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
  return res.json() as string[];
}
