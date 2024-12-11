import { commonProtocol } from '@hicommonwealth/evm-protocols';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import NodeInfo from 'models/NodeInfo';
import React from 'react';
import app from 'state';
import {
  usePinTokenToCommunityMutation,
  useUnpinTokenFromCommunityMutation,
} from 'state/api/communities';
import { fetchCachedNodes } from 'state/api/nodes';
import TokenFinder, { useTokenFinder } from 'views/components/TokenFinder';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './ConnectTokenStep.scss';
import { ConnectTokenStepProps, ConnectTokenStepSubmitValues } from './types';
import { connectTokenFormValidationSchema } from './validation';

const ConnectTokenStep = ({
  onConnect,
  onCancel,
  existingToken,
}: ConnectTokenStepProps) => {
  const communityId = app.activeChainId() || '';

  // base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.Base,
  ) as NodeInfo; // this is expected to exist

  const {
    debouncedTokenValue,
    getTokenError,
    setTokenValue,
    tokenMetadata,
    tokenMetadataLoading,
    tokenValue,
  } = useTokenFinder({
    nodeEthChainId: baseNode.ethChainId || 0,
  });

  const { mutateAsync: pinToken, isLoading: isPinningToken } =
    usePinTokenToCommunityMutation();

  const { mutateAsync: unpinToken, isLoading: isUnpinningToken } =
    useUnpinTokenFromCommunityMutation({
      resetCacheOnSuccess: false,
    });

  const isActionPending =
    tokenMetadataLoading || isPinningToken || isUnpinningToken;

  const areActionsDisabled = !!getTokenError() || isActionPending;

  const handleSubmit = (values: ConnectTokenStepSubmitValues) => {
    if (areActionsDisabled) return;

    // return early if user is trying to pin an existing token again
    if (existingToken && existingToken?.name === tokenMetadata?.name) {
      notifyInfo('This token is already connected to your community.');
      return;
    }

    const handleAsync = async () => {
      try {
        // unpin existing token if there is any
        if (existingToken) {
          await unpinToken({
            community_id: communityId,
          });
        }

        // pin the new token
        await pinToken({
          community_id: communityId,
          chain_node_id: parseInt(values.chainNodeId),
          contract_address: values.tokenAddress,
        });

        notifySuccess(`${tokenMetadata?.name} connected successfully!`);

        onConnect();
      } catch {
        notifyError('Failed to pin token to community!');
      }
    };
    handleAsync().catch(console.error);
  };

  return (
    <CWForm
      validationSchema={connectTokenFormValidationSchema}
      onSubmit={handleSubmit}
      className="ConnectTokenStep"
      initialValues={{
        chainNodeId: baseNode.id,
      }}
    >
      <div className="chain-selector">
        <div className="header">
          <CWText type="h5">Supported Chains</CWText>
          <CWText className="description">
            The following are the pre-selected chain(s) all token features will
            be interacting with.
          </CWText>
        </div>
        <CWRadioButton
          value={`${baseNode.id}`}
          checked
          name="chainNodeId"
          hookToForm
          label="BASE"
        />
      </div>
      <div className="token-finder-container">
        <div className="header">
          <CWText type="h5">Primary Token</CWText>
          <CWText className="description">
            Any token features such as voting or tipping require your community
            to define a primary token.
          </CWText>
        </div>
        <TokenFinder
          debouncedTokenValue={debouncedTokenValue}
          setTokenValue={setTokenValue}
          tokenMetadata={tokenMetadata}
          tokenMetadataLoading={tokenMetadataLoading}
          tokenValue={tokenValue}
          tokenError={getTokenError()}
          name="tokenAddress"
          label=""
          hookToForm
          fullWidth
          placeholder="Please enter primary token address"
        />
      </div>
      <CWDivider />
      {(isPinningToken || isUnpinningToken) && <CWCircleMultiplySpinner />}
      <section className="action-buttons">
        <CWButton
          type="button"
          label="Cancel"
          buttonWidth="wide"
          buttonType="secondary"
          onClick={onCancel}
        />
        <CWButton
          type="submit"
          label="Connect token"
          buttonWidth="wide"
          disabled={areActionsDisabled}
          onClick={onConnect}
        />
      </section>
    </CWForm>
  );
};

export default ConnectTokenStep;
