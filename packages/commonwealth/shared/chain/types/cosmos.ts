import { GovV1AtomOneClient, GovV1Client } from '@hicommonwealth/chains';

// currently just used for gov v1, but this can be expanded
export type LCD = {
  cosmos: {
    gov: {
      v1: GovV1Client;
    };
  };
};
export type AtomOneLCD = {
  atomone: {
    gov: {
      v1: GovV1AtomOneClient;
    };
  };
};
