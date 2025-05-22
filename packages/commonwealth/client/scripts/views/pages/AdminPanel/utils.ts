import axios from 'axios';
import NodeInfo from 'client/scripts/models/NodeInfo';
import { SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';

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
