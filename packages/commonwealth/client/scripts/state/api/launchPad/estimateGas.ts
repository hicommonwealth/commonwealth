import { useQuery } from '@tanstack/react-query';
import LaunchpadBondingCurve from 'helpers/ContractHelpers/Launchpad';

const ESTIMATE_GAS_TIME = 10 * 1000; // 10s

interface EstimateGasProps {
  chainRpc: string;
  ethChainId: number;
}

const estimateGas = async ({ ethChainId, chainRpc }: EstimateGasProps) => {
  const launchPad = new LaunchpadBondingCurve(
    getFactoryContract(ethChainId).LPBondingCurve,
    getFactoryContract(ethChainId).Launchpad,
    '',
    getFactoryContract(ethChainId).TokenCommunityManager,
    chainRpc,
  );

  return await launchPad.estimateGas();
};

const useEstimateGasQuery = ({
  chainRpc,
  ethChainId,
  apiEnabled = true,
}: EstimateGasProps & { apiEnabled?: boolean }) => {
  return useQuery({
    queryKey: [chainRpc, ethChainId],
    queryFn: () => estimateGas({ chainRpc, ethChainId }),
    enabled: apiEnabled,
    staleTime: ESTIMATE_GAS_TIME,
    gcTime: ESTIMATE_GAS_TIME,
  });
};

export default useEstimateGasQuery;
