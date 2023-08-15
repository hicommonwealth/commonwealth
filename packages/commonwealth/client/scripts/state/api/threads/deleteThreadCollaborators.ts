import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface DeleteThreadCollaboratorsProps {
  address: string;
  chainId: string;
  threadId: number;
  updatedCollaborators: any[]; // TODO: we need to properly build the collaborator modal in FE and use it here
}

const deleteThreadCollaborators = async ({
  address,
  chainId,
  threadId,
  updatedCollaborators,
}: DeleteThreadCollaboratorsProps) => {
  const response = await axios.post(`${app.serverUrl()}/deleteEditors`, {
    address: address,
    author_chain: chainId,
    chain: chainId,
    thread_id: threadId,
    editors: updatedCollaborators,
    jwt: app.user.jwt,
  });

  return response.data.result.collaborators;
};

interface DeleteThreadCollaboratorsMutationProps {
  chainId: string;
  threadId: number;
}

const useDeleteThreadCollaboratorsMutation = ({
  chainId,
  threadId,
}: DeleteThreadCollaboratorsMutationProps) => {
  return useMutation({
    mutationFn: deleteThreadCollaborators,
    onSuccess: async (collaborators) => {
      updateThreadInAllCaches(chainId, threadId, { collaborators }); // mimic the thread partial body
      return collaborators; // TODO: improve it and return thread as the proper response.
    },
  });
};

export default useDeleteThreadCollaboratorsMutation;
