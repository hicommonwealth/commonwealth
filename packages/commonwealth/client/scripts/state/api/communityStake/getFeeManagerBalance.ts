import { useQuery } from '@tanstack/react-query';
import { useNamespaceFactory } from 'views/pages/CreateCommunity/steps/CommunityTransactions';

import NamespaceFactory from 'helpers/ContractHelpers/NamespaceFactory';
import { ContractMethods } from 'state/api/config';

const GET_FEE_MANAGER_BALANCE_STALE_TIME = 60 * 1_000; // 60 sec

interface GetFeeManagerBalanceProps {
  namespaceFactory: NamespaceFactory;
  namespace: string;
  token?: string;
  decimals?: number;
}

const getFeeManagerBalance = async ({
  namespaceFactory,
  namespace,
  token,
  decimals,
}: GetFeeManagerBalanceProps) => {
  const balance = await namespaceFactory.getFeeManagerBalance(
    namespace,
    token,
    decimals,
  );

  if (balance === '0.') {
    return '0';
  }

  return balance;
};

interface UseGetFeeManagerBalanceQueryProps {
  ethChainId: number;
  namespace: string;
  token?: string;
  decimals?: number;
  apiEnabled: boolean;
}

const useGetFeeManagerBalanceQuery = ({
  ethChainId,
  namespace,
  token,
  decimals,
  apiEnabled,
}: UseGetFeeManagerBalanceQueryProps) => {
  const { namespaceFactory } = useNamespaceFactory(ethChainId);

  return useQuery({
    queryKey: [
      ContractMethods.GET_FEE_MANAGER_BALANCE,
      namespaceFactory,
      namespace,
      token,
      decimals,
    ],
    queryFn: () =>
      getFeeManagerBalance({ namespaceFactory, namespace, token, decimals }),
    enabled: apiEnabled,
    staleTime: GET_FEE_MANAGER_BALANCE_STALE_TIME,
  });
};

export default useGetFeeManagerBalanceQuery;
