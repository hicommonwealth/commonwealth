import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface ToggleThreadArchiveProps {
  chainId: string;
  threadId: number;
  isArchived: boolean;
}

const toggleThreadArchive = async ({
  chainId,
  threadId,
  isArchived,
}: ToggleThreadArchiveProps) => {
  const method = isArchived ? 'delete' : 'put';
  return await axios[method](
    `${app.serverUrl()}/threads/${threadId}/archive`,
    {
      data: {
        jwt: app.user.jwt,
        chain_id: chainId,
      } as any,
    }
  );
};

interface ToggleThreadArchiveMutationProps {
  chainId: string;
  threadId: number;
}

const useToggleThreadArchiveMutation = ({
  chainId,
  threadId,
}: ToggleThreadArchiveMutationProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation({
    mutationFn: toggleThreadArchive,
    onSuccess: async (response) => {
      console.log('response => ', response);
      updateThreadInAllCaches(chainId, threadId, {
        archivedAt: response.data.result.archived_at,
      });
      return response.data.result;
    },
  });
};

export default useToggleThreadArchiveMutation;
