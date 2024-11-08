import React from 'react';
import { useUpdateCommunityMutation } from 'state/api/communities';
import { useLaunchTokenMutation } from 'state/api/launchPad';
import { useCreateTokenMutation } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import CWBanner from 'views/components/component_kit/new_designs/CWBanner';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ActionSteps from 'views/pages/CreateCommunity/components/ActionSteps';
import { ActionStepsProps } from 'views/pages/CreateCommunity/components/ActionSteps/types';
import { SignTokenTransactionsProps } from '../types';
import './SignTokenTransactions.scss';

const SignTokenTransactions = ({
  createdCommunityId,
  selectedAddress,
  baseNode,
  tokenInfo,
  onSuccess,
  onCancel,
}: SignTokenTransactionsProps) => {
  const user = useUserStore();

  const {
    mutateAsync: launchToken,
    isLoading: isCreatingToken,
    error: tokenLaunchError,
    data: createdToken,
  } = useLaunchTokenMutation();

  const { mutateAsync: createToken } = useCreateTokenMutation();

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: createdCommunityId,
  });

  const handleSign = async () => {
    try {
      if (selectedAddress?.address) {
        user.setData({
          addressSelectorSelectedAddress: selectedAddress.address,
        });
      }

      // 1. Attempt Launch token on chain
      const payload = {
        chainRpc: baseNode.url,
        ethChainId: baseNode.ethChainId || 0, // this will always exist, adding 0 to avoid typescript issues
        name: tokenInfo.name.trim(),
        symbol: tokenInfo.symbol.trim(),
        walletAddress: selectedAddress.address,
      };

      const txReceipt = await launchToken(payload);

      // 2. store `tokenInfo` on db
      await createToken({
        transaction_hash: txReceipt.transactionHash,
        chain_node_id: baseNode.id,
        community_id: createdCommunityId,
        icon_url: tokenInfo?.imageURL?.trim() || '',
        description: tokenInfo?.description?.trim() || '',
      });

      // 3. update community to reference the created token
      await updateCommunity({
        id: createdCommunityId,
        token_name: payload.name,
      });

      onSuccess();
    } catch (e) {
      // this will be displayed in the action step as `errorText`, no need to notify here
      console.error(e);
    }
  };

  const getActionSteps = (): ActionStepsProps['steps'] => {
    return [
      {
        label: 'Launch token',
        state: isCreatingToken
          ? 'loading'
          : createdToken
            ? 'completed'
            : 'not-started',
        actionButton: {
          label: 'Sign',
          disabled: false,
          onClick: () => {
            handleSign().catch(console.error);
          },
        },
        errorText: tokenLaunchError
          ? 'Something went wrong when creating the token'
          : '',
      },
    ];
  };

  return (
    <div className="SignTokenTransactions">
      <section className="header">
        <CWText type="h2">
          Sign transactions to launch token and community
        </CWText>
        <CWText type="b1" className="description">
          In order to launch token and community you will need to sign a
          transaction. This transaction has associated gas fees.
        </CWText>

        <CWBanner
          body="Do not close the window or navigate away until the transactions are
          complete."
          type="info"
        />

        <ActionSteps steps={getActionSteps()} />

        <CWDivider />

        <section className="action-buttons">
          <CWButton
            type="button"
            label="Cancel"
            buttonWidth="wide"
            buttonType="secondary"
            disabled={isCreatingToken}
            onClick={onCancel}
          />
        </section>
      </section>
    </div>
  );
};

export default SignTokenTransactions;
