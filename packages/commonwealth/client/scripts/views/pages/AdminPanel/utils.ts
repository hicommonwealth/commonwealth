import { BalanceType } from '@hicommonwealth/shared';
import axios from 'axios';
import NodeInfo from 'client/scripts/models/NodeInfo';
import { SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

export const createChainNode = async ({
  url,
  name,
  balance_type,
  eth_chain_id,
}: {
  url: string;
  name: string;
  balance_type: BalanceType;
  eth_chain_id: number;
}) => {
  return await axios.post(`${SERVER_URL}/nodes`, {
    url,
    name,
    balance_type,
    eth_chain_id,
    jwt: userStore.getState().jwt,
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
  return await axios.put(`${SERVER_URL}/nodes/${id}`, {
    url,
    name,
    bech32,
    balance_type,
    eth_chain_id,
    cosmos_chain_id,
    jwt: userStore.getState().jwt,
  });
};

export const updateCommunityId = async ({ community_id, new_community_id }) => {
  await axios.patch(`${SERVER_URL}/communities/update_id`, {
    jwt: userStore.getState().jwt,
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
  await axios.patch(`${SERVER_URL}/communities/${community_id}`, {
    jwt: userStore.getState().jwt,
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
  await axios.post(`${SERVER_URL}/updateSiteAdmin`, {
    address,
    siteAdmin,
    jwt: userStore.getState().jwt,
  });
};

export const getCSVContent = async ({ id }: { id: string }) => {
  const res = await axios.post(`${SERVER_URL}/exportMembersList`, {
    communityId: id,
    jwt: userStore.getState().jwt,
  });

  return res.data.result.data[0];
};

export const getTopUsersList = async () => {
  const res = await axios.get(`${SERVER_URL}/admin/top-users`, {
    params: {
      jwt: userStore.getState().jwt,
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

export const getSortedChains = (chainNodes: NodeInfo[] | undefined) => {
  return (
    chainNodes
      ?.map((chain) => ({
        label: chain.name,
        value: chain.id,
      }))
      .sort((a, b) =>
        (a?.label || '').toLowerCase().localeCompare(b?.label || ''),
      ) || []
  );
};
