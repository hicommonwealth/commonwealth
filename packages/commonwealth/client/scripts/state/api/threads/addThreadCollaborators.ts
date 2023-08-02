import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface AddThreadCollaboratorsProps {
  address: string;
  chainId: string;
  threadId: number;
  newCollaborators: any[]; // TODO: we need to properly build the collaborator modal in FE and use it here
}

const addThreadCollaborators = async ({
  address,
  chainId,
  threadId,
  newCollaborators,
}: AddThreadCollaboratorsProps) => {
  const response = await axios.post(`${app.serverUrl()}/addEditors`, {
    address: address,
    author_chain: chainId,
    chain: chainId,
    thread_id: threadId,
    editors: newCollaborators,
    jwt: app.user.jwt,
  });

  return response.data.result.collaborators;
};

interface UseAddThreadCollaboratorsMutationProps {
  chainId: string;
  threadId: number;
}

const useAddThreadCollaboratorsMutation = ({
  chainId,
  threadId,
}: UseAddThreadCollaboratorsMutationProps) => {
  return useMutation({
    mutationFn: addThreadCollaborators,
    onSuccess: async (collaborators) => {
      updateThreadInAllCaches(chainId, threadId, { collaborators }); // mimic the thread partial body
      return collaborators; // TODO: improve it and return thread as the proper response.
    },
  });
};

export default useAddThreadCollaboratorsMutation;
