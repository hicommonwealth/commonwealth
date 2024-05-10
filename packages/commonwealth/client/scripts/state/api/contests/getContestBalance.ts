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
}: UseGetContestBalanceProps) => {
  const contest = new Contest(
    contestAddress,
    commonProtocol.factoryContracts[ethChainId].factory,
    chainRpc,
  );

  return await contest.getContestBalance();
};

interface UseGetContestBalanceQueryProps {
  contestAddress: string;
  chainRpc: string;
  ethChainId: number;
}

const useGetContestBalanceQuery = ({
  contestAddress,
  chainRpc,
  ethChainId,
}: UseGetContestBalanceQueryProps) => {
  return useQuery({
    queryKey: [
      ContractMethods.GET_CONTEST_BALANCE,
      contestAddress,
      chainRpc,
      ethChainId,
    ],
    queryFn: () => getContestBalance({ contestAddress, chainRpc, ethChainId }),
    staleTime: GET_CONTEST_BALANCE_STALE_TIME,
    enabled: !!contestAddress,
  });
};

export default useGetContestBalanceQuery;
