import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface CreateGroupProps {
  chainId: string;
  address: string;
}

const createGroup = async ({ chainId, address }: CreateGroupProps) => {
  return await axios.post(`${app.serverUrl()}/groups`, {
    jwt: app.user.jwt,
    chain: chainId,
    author_chain: chainId,
    address,
    // TODO: get this data when api is complete
    metadata: {},
    requirements: [],
  });
};

const useCreateGroupMutation = () => {
  return useMutation({
    mutationFn: createGroup,
    onSuccess: async () => {
      // TODO: manage cache if any
    },
  });
};

export default useCreateGroupMutation;
