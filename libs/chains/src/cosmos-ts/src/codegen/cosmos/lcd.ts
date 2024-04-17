import { LCDClient } from '@osmonauts/lcd';
export const createLCDClient = async ({
  restEndpoint,
}: {
  restEndpoint: string;
}) => {
  const requestClient = new LCDClient({
    restEndpoint,
  });
  return {
    cosmos: {
      gov: {
        v1: new (await import('./gov/v1/query.lcd.js')).LCDQueryClient({
          requestClient,
        }),
      },
    },
  };
};
