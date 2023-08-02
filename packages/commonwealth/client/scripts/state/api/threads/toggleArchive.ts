import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';

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
  return await axios.post(
    `${app.serverUrl()}/threads/${threadId}/${
      !isArchived ? 'archive' : 'unarchive'
    }`,
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

const toggleThreadArchiveMutation = ({
  chainId,
  threadId,
}: ToggleThreadArchiveMutationProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation({
    mutationFn: toggleThreadArchive,
    onSuccess: async (response) => {
      console.log('response => ', response);
      // TODO: complete this
      // TODO: migrate the thread store objects, then clean this up
      // return foundThread
    },
  });
};

export default toggleThreadArchiveMutation;
