import { BalanceType } from '@hicommonwealth/shared';
import axios from 'axios';
import app from 'state';

export const createChainNode = async ({
  url,
  name,
  bech32,
  balance_type,
  eth_chain_id,
  cosmos_chain_id,
}: {
  url: string;
  name: string;
  bech32: string;
  balance_type: BalanceType;
  eth_chain_id: number;
  cosmos_chain_id: string;
}) => {
  return await axios.post(`${app.serverUrl()}/nodes`, {
    url,
    name,
    bech32,
    balance_type,
    eth_chain_id,
    cosmos_chain_id,
    jwt: app.user.jwt,
  });
};

export const updateChainNode = async ({
  id,
  url,
  name,
  bech32,
  balance_type,
  eth_chain_id,
  cosmos_chain_id,
}: {
  id: number;
  url: string;
  name: string;
  bech32: string;
  balance_type: BalanceType;
  eth_chain_id: number;
  cosmos_chain_id: string;
}) => {
  return await axios.put(`${app.serverUrl()}/nodes/${id}`, {
    url,
    name,
    bech32,
    balance_type,
    eth_chain_id,
    cosmos_chain_id,
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

export const updateCommunityId = async ({ community_id, new_community_id }) => {
  await axios.patch(`${app.serverUrl()}/communities/update_id`, {
    jwt: app.user.jwt,
    community_id,
    new_community_id,
    redirect: true,
  });
};

export const updateCommunityCustomDomain = async ({
  community_id,
  custom_domain,
}: {
  community_id: string;
  custom_domain: string;
}) => {
  await axios.patch(`${app.serverUrl()}/communities/${community_id}`, {
    jwt: app.user.jwt,
    id: community_id,
    custom_domain,
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
    communityId: id,
    jwt: app.user.jwt,
  });

  return res.data.result.data[0];
};

export const getTopUsersList = async () => {
  const res = await axios.get(`${app.serverUrl()}/admin/top-users`, {
    params: {
      jwt: app.user.jwt,
    },
  });
  return res.data.result;
};

type CSVRow = Record<string, string | number | string[] | number[]>;

export function downloadCSV(rows: CSVRow[], filename: string) {
  if (rows.length === 0) {
    throw new Error('No rows in dataset');
  }
  const labels = Object.keys(rows[0]);
  const csvContent = [
    labels,
    ...rows.map((row) =>
      Object.values(row).map((col) =>
        // Enclose in quotes and escape existing quotes
        typeof col === 'string' ? `"${col.replace(/"/g, '""')}"` : col,
      ),
    ),
  ]
    .map((row) => row.join(','))
    .join('\n');
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
