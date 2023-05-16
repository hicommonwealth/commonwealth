import axios from 'axios';
import app from 'state';
import { BalanceType } from '../../../../../../common-common/src/types';

export const createChainNode = async ({
  url,
  name,
  bech32,
  balance_type,
}: {
  url: string;
  name: string;
  bech32: string;
  balance_type: BalanceType;
}) => {
  return await axios.post(`${app.serverUrl()}/createChainNode`, {
    url,
    name,
    bech32,
    balance_type,
    jwt: app.user.jwt,
  });
};

export const deleteChain = async ({ id }: { id: string }) => {
  await axios.post(`${app.serverUrl()}/deleteChain`, {
    id,
    jwt: app.user.jwt,
  });
};

export const updateSiteAdmin = async ({
  address,
  siteAdmin,
}: {
  address: string;
  siteAdmin: boolean;
}) => {
  await axios.post(`${app.serverUrl()}/updateSiteAdmin`, {
    address,
    siteAdmin,
    jwt: app.user.jwt,
  });
};
