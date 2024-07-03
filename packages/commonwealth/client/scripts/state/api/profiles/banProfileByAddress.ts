import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { userStore } from '../../ui/user';

interface BanProfileByAddressProps {
  address: string;
  communityId: string;
}

const banProfileByAddress = async ({
  address,
  communityId,
}: BanProfileByAddressProps) => {
  return await axios.post('/api/banAddress', {
    jwt: userStore.getState().jwt,
    address: address,
    community_id: communityId,
  });
};

const useBanProfileByAddressMutation = () => {
  return useMutation({
    mutationFn: banProfileByAddress,
    onSuccess: async (response) => {
      return response;
    },
  });
};

export default useBanProfileByAddressMutation;
