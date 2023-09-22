import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useEffect, useState } from 'react';

import { ChainBase, ChainNetwork } from 'common-common/src/types';

import 'components/Header/LoginSelector.scss';

import useForceRerender from 'hooks/useForceRerender';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import app from 'state';
import { LoginSelectorMenuLeft } from 'views/components/Header/LoginSelectorMenuLeft';
import { LoginSelectorMenuRight } from 'views/components/Header/LoginSelectorMenuRight';
import useJoinCommunity from 'views/components/Header/useJoinCommunity';
import { User } from 'views/components/user/user';
import { LoginModal } from 'views/modals/login_modal';
import NewProfilesController from '../../../controllers/server/newProfiles';
import { CWButton } from '../component_kit/new_designs/cw_button';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';

const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
  [ChainBase.Solana]: 'Solana',
};

const CHAINNETWORK_SHORT = {
  [ChainNetwork.AxieInfinity]: 'Ronin',
  [ChainNetwork.Terra]: 'Terra',
};

export const LoginSelector = () => {
  const forceRerender = useForceRerender();
  const [profileLoadComplete, setProfileLoadComplete] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const {
    handleJoinCommunity,
    sameBaseAddressesRemoveDuplicates,
    JoinCommunityModals,
  } = useJoinCommunity();

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  useEffect(() => {
    NewProfilesController.Instance.isFetched.on('redraw', () => {
      setProfileLoadComplete(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoginModalOpen && app.chain?.meta?.id == 'injective') {
      forceRerender();
    }
  }, [forceRerender, isLoginModalOpen]);

  const leftMenuProps = usePopover();
  const rightMenuProps = usePopover();

  const onLogout = () => {
    forceRerender();
    rightMenuProps.setAnchorEl?.(null);
  };

  if (!app.isLoggedIn()) {
    return (
      <>
        <div className="LoginSelector">
          <CWButton
            buttonType="primary"
            buttonHeight="sm"
            label="Login"
            buttonWidth="wide"
            onClick={() => setIsLoginModalOpen(true)}
          />
        </div>
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsLoginModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsLoginModalOpen(false)}
          open={isLoginModalOpen}
        />
      </>
    );
  }

  if (!profileLoadComplete) {
    setProfileLoadComplete(true);
  }

  return (
    <>
      <div className="LoginSelector">
        {app.chain &&
          !app.chainPreloading &&
          profileLoadComplete &&
          !hasJoinedCommunity && (
            <div className="join-button-container">
              <CWButton
                buttonType="primary"
                onClick={handleJoinCommunity}
                label={
                  sameBaseAddressesRemoveDuplicates.length === 0
                    ? `No ${
                        CHAINNETWORK_SHORT[app.chain?.meta?.network] ||
                        CHAINBASE_SHORT[app.chain?.meta?.base] ||
                        ''
                      } address`
                    : 'Join community'
                }
              />
            </div>
          )}
        {profileLoadComplete && (
          <ClickAwayListener
            onClickAway={() => {
              leftMenuProps.setAnchorEl(null);
            }}
          >
            <div className="button-container">
              <div
                className="left-button"
                onClick={leftMenuProps.handleInteraction}
              >
                <User
                  userAddress={app.user.addresses[0].address}
                  userChainId={
                    app.user.addresses[0].chain?.id ||
                    app.user.addresses[0].profile?.chain
                  }
                />
              </div>

              <Popover content={<LoginSelectorMenuLeft />} {...leftMenuProps} />
            </div>
          </ClickAwayListener>
        )}
        <ClickAwayListener
          onClickAway={() => {
            rightMenuProps.setAnchorEl(null);
          }}
        >
          <div className="button-container">
            <div
              className="right-button"
              onClick={rightMenuProps.handleInteraction}
            >
              <CWIconButton iconName="person" iconButtonTheme="black" />
            </div>
            <Popover
              content={<LoginSelectorMenuRight onLogout={onLogout} />}
              {...rightMenuProps}
            />
          </div>
        </ClickAwayListener>
      </div>
      {JoinCommunityModals}
    </>
  );
};
