import { factoryContracts } from '@hicommonwealth/evm-protocols';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import Permissions from 'client/scripts/utils/Permissions';
import { notifyError } from 'controllers/app/notifications';
import useCommunityStake from 'features/communityStake/hooks/useCommunityStake';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useGetCommunityByIdQuery from 'state/api/communities/getCommuityById';
import useUserStore from 'state/ui/user';
import { HandleCreateTopicProps } from '../Topics/topicFlow';
import { CreateTopicStep } from '../Topics/utils';

export interface StakeIntegrationProps {
  isTopicFlow?: boolean;
  onTopicFlowStepChange?: (step: CreateTopicStep) => void;
  onCreateTopic: (props: HandleCreateTopicProps) => Promise<void>;
}

const useStakeIntegrationData = ({
  isTopicFlow,
  onTopicFlowStepChange,
  onCreateTopic,
}: StakeIntegrationProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { stakeEnabled, refetchStakeQuery } = useCommunityStake();

  const { data: community } = useGetCommunityByIdQuery({
    id: app.chain.meta.id,
    includeNodeInfo: true,
  });

  const contractInfo =
    factoryContracts[app?.chain?.meta?.ChainNode?.eth_chain_id || ''];
  const isAuthorized =
    user.isLoggedIn &&
    (Permissions.isSiteAdmin() || Permissions.isCommunityAdmin());

  const selectedAddress = user.addresses.find(
    (address) =>
      address.address === user.activeAccount?.address &&
      address.community?.id === community?.id,
  );

  const communityChainId = `${
    community?.ChainNode?.eth_chain_id || community?.ChainNode?.cosmos_chain_id
  }`;

  const createTopicHandler = () => {
    onCreateTopic({
      stake: {
        weightedVoting: TopicWeightedVoting.Stake,
      },
    }).catch((error) => {
      notifyError('Failed to create topic');
      console.log(error);
    });
  };

  const goBack = () => {
    if (isTopicFlow) {
      onTopicFlowStepChange?.(CreateTopicStep.WVMethodSelection);
      return;
    }

    navigate('/manage/integrations');
  };

  const handleStakeConfigured = () => {
    refetchStakeQuery().catch(console.error);
  };

  return {
    community,
    communityChainId,
    contractInfo,
    createTopicHandler,
    goBack,
    handleStakeConfigured,
    isAuthorized,
    isTopicFlow,
    selectedAddress,
    stakeEnabled: stakeEnabled || false,
  };
};

export type StakeIntegrationData = ReturnType<typeof useStakeIntegrationData>;

export default useStakeIntegrationData;
