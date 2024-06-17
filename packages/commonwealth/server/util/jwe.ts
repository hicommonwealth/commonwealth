import NodeJose from 'node-jose';

// This utility is taken from discord-bot-ui and is used to encode/decode
// discord user data for login/validation purposes.
// See: https://github.com/hicommonwealth/discord-bot-ui/blob/master/services/jwe.ts

export const encryptWithJWE = async (raw: Record<string, unknown>) => {
  const _publicKey = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY
    ? process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY
    : 'undefined';
  const publicKey = await NodeJose.JWK.asKey(_publicKey, 'pem');

  const buffer = Buffer.from(JSON.stringify(raw));
  const encrypted = await NodeJose.JWE.createEncrypt(
    { format: 'compact', contentAlg: 'A256GCM', fields: { alg: 'RSA-OAEP' } },
    publicKey,
  )
    .update(buffer)
    .final();

  return encrypted;
};

export const decryptWithJWE = async (encryptedBody: string) => {
  const _privateKey = process.env.NEXT_PUBLIC_RSA_PRIVATE_KEY
    ? process.env.NEXT_PUBLIC_RSA_PRIVATE_KEY
    : 'undefined';
  const privateKey = await NodeJose.JWK.asKey(_privateKey, 'pem');

  const output = await NodeJose.JWE.createDecrypt(privateKey).decrypt(
    encryptedBody,
  );

  const claims = Buffer.from(output.plaintext).toString();

  return claims;
};
