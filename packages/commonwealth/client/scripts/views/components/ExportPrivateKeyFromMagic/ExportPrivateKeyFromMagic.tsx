import { Magic } from 'magic-sdk';
import { useEffect } from 'react';

const magic = new Magic(process.env.MAGIC_PUBLISHABLE_KEY!);

export const ExportPrivateKeyFromMagic = () => {
  useEffect(() => {
    async function doAsync() {
      await magic.user.revealPrivateKey();
    }

    doAsync().catch(console.error);
  }, []);

  return null;
};
