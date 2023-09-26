import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface EditGroupProps {
  chainId: string;
  groupId: string;
  address: string;
}

const editGroup = async ({ groupId, chainId, address }: EditGroupProps) => {
  return await axios.put(`${app.serverUrl()}/groups/${groupId}`, {
    jwt: app.user.jwt,
    chain: chainId,
    author_chain: chainId,
    address,
    // TODO: get this data when api is complete
    metadata: {},
    requirements: [],
  });
};

const useEditGroupMutation = () => {
  return useMutation({
    mutationFn: editGroup,
    onSuccess: async () => {
      // TODO: manage cache if any
    },
  });
};

export default useEditGroupMutation;
