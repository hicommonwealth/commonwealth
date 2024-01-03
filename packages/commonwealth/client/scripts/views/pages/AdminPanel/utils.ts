import { BalanceType } from '@hicommonwealth/core';
import axios from 'axios';
import app from 'state';

export const createChainNode = async ({
  url,
  name,
  bech32,
  balance_type,
  eth_chain_id,
}: {
  url: string;
  name: string;
  bech32: string;
  balance_type: BalanceType;
  eth_chain_id: number;
}) => {
  return await axios.post(`${app.serverUrl()}/nodes`, {
    url,
    name,
    bech32,
    balance_type,
    eth_chain_id,
    jwt: app.user.jwt,
  });
};

export const deleteCommunity = async ({ id }: { id: string }) => {
  await axios.delete(`${app.serverUrl()}/communities/${id}`, {
    data: {
      jwt: app.user.jwt,
    },
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

export const getCSVContent = async ({ id }: { id: string }) => {
  const res = await axios.post(`${app.serverUrl()}/exportMembersList`, {
    chainId: id,
    jwt: app.user.jwt,
  });

  return res.data.result.data[0];
};
