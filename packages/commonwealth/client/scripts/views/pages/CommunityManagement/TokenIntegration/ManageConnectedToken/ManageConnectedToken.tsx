import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import { useUnpinTokenFromCommunityMutation } from 'state/api/communities';
import TokenBanner from 'views/components/TokenBanner';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import ConnectTokenForm from '../ConnectTokenForm';
import './ManageConnectedToken.scss';
import { ManageConnectedTokenProps } from './types';

const ManageConnectedToken = ({
  isLoadingToken,
  tokenInfo,
}: ManageConnectedTokenProps) => {
  const [isChangingToken, setIsChangingToken] = useState(false);

  const { mutateAsync: unpinToken, isLoading: isUnpinningToken } =
    useUnpinTokenFromCommunityMutation({
      resetCacheOnSuccess: true,
    });
  const isActionPending = isUnpinningToken;

  const handleUnpinToken = () => {
    if (isActionPending) return;

    const handleAsync = async () => {
      try {
        await unpinToken({
          community_id: app.activeChainId() || '',
        });
        notifySuccess('Token disconnected from community!');
      } catch {
        notifyError('Failed to disconnect token from community!');
      }
    };
    handleAsync().catch(console.error);
  };

  if (isChangingToken) {
    return (
      <ConnectTokenForm
        existingToken={tokenInfo}
        onCancel={() => setIsChangingToken(false)}
      />
    );
  }

  return (
    <section className="ManageConnectedToken">
      <div className="connected-token">
        <TokenBanner
          isLoading={isLoadingToken}
          avatarUrl={tokenInfo?.logo}
          name={tokenInfo?.name}
          ticker={tokenInfo?.symbol}
        />
        <CWDivider />
        {isActionPending && <CWCircleMultiplySpinner />}
        <section className="action-buttons">
          <CWButton
            type="button"
            label="Remove"
            buttonType="destructive"
            buttonWidth="wide"
            disabled={isActionPending}
            onClick={handleUnpinToken}
          />
          <CWButton
            type="button"
            label="Change Token"
            buttonWidth="wide"
            disabled={isActionPending}
            onClick={() => setIsChangingToken(true)}
          />
        </section>
      </div>
    </section>
  );
};

export default ManageConnectedToken;
