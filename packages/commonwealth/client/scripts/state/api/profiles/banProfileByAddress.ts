import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';

interface BanProfileByAddressProps {
  address: string;
  chainId: string;
}

const banProfileByAddress = async ({
  address,
  chainId,
}: BanProfileByAddressProps) => {
  return await axios.post('/api/banAddress', {
    jwt: app.user.jwt,
    address: address,
    community_id: chainId,
  });
};

const useBanProfileByAddressMutation = ({
  chainId,
  address,
}: BanProfileByAddressProps) => {
  return useMutation({
    mutationFn: banProfileByAddress,
    onSuccess: async (response) => {
      return response;
    },
  });
};

export default useBanProfileByAddressMutation;
