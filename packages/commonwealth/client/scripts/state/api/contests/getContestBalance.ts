import { commonProtocol } from '@hicommonwealth/shared';
import { useQuery } from '@tanstack/react-query';
import Contest from 'helpers/ContractHelpers/Contest';
import { ContractMethods } from 'state/api/config';

const GET_CONTEST_BALANCE_STALE_TIME = 60 * 1_000; // 1 min

interface UseGetContestBalanceProps extends UseGetContestBalanceQueryProps {}

const getContestBalance = async ({
  contestAddress,
  chainRpc,
  ethChainId,
  isOneOff,
}: UseGetContestBalanceProps) => {
  const contest = new Contest(
    contestAddress,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.getContestBalance(isOneOff);
};

interface UseGetContestBalanceQueryProps {
  contestAddress: string;
  chainRpc: string;
  ethChainId: number;
  apiEnabled?: boolean;
  isOneOff: boolean;
}

const useGetContestBalanceQuery = ({
  contestAddress,
  chainRpc,
  ethChainId,
  apiEnabled = true,
  isOneOff,
}: UseGetContestBalanceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_CONTEST_BALANCE,
      contestAddress,
      chainRpc,
      ethChainId,
      isOneOff,
    ],
    queryFn: () =>
      getContestBalance({ contestAddress, chainRpc, ethChainId, isOneOff }),
    staleTime: GET_CONTEST_BALANCE_STALE_TIME,
    enabled: !!contestAddress && apiEnabled,
  });
};

export default useGetContestBalanceQuery;
