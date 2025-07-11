import { fetchCachedPublicEnvVar } from 'client/scripts/state/api/configuration';
import { Magic } from 'magic-sdk';
import { useEffect } from 'react';

export const ExportPrivateKeyFromMagic = () => {
  const { MAGIC_PUBLISHABLE_KEY } = fetchCachedPublicEnvVar() || {};
  if (!MAGIC_PUBLISHABLE_KEY) {
    return null;
  }

  const magic = new Magic(MAGIC_PUBLISHABLE_KEY);

  useEffect(() => {
    async function doAsync() {
      await magic.user.revealPrivateKey();
    }

    doAsync().catch(console.error);
  }, []);

  return null;
};
