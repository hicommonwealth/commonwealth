import { setActiveAccount } from 'controllers/app/login';
import { isSameAccount } from 'helpers';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { UserBlock } from 'views/components/user/user_block';
import { LoginModal } from 'views/modals/login_modal';
import { CWModal } from '../component_kit/new_designs/CWModal';

import 'components/Header/LoginSelectorMenu.scss';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';

export const LoginSelectorMenuLeft = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
  const chain =
    typeof activeAccount.chain === 'string'
      ? activeAccount.chain
      : activeAccount.chain?.id;
  const { data: users } = useFetchProfilesByAddressesQuery({
    profileChainIds: [chain],
    profileAddresses: [activeAccount.address],
    currentChainId: app.activeChainId(),
  });
  const profileId = users?.[0]?.id;

  const changeSelectedAddress = () => {
    setSelectedAddress(activeAccount.address);
    forceRerender();
  };

  useEffect(() => {
    setSelectedAddress(activeAccount.address);

    // force rerender when new address is connected
    app.user.isFetched.on('redraw', () => {
      changeSelectedAddress();
    });

    return () => {
      app.user.isFetched.off('redraw', () => {
        changeSelectedAddress();
      });
    };
  }, []);

  const { activeAccounts } = app.user;

  return (
    <div className="LoginSelectorMenu left">
      {app.activeChainId() && (
        <>
          {activeAccounts?.length > 0 && (
            <CWText type="caption" className="title">
              Select address to use
            </CWText>
          )}
          {activeAccounts.map((account, i) => {
            return (
              <div
                key={i}
                className={`login-menu-item ${
                  selectedAddress === account.address ? 'selected' : ''
                }`}
                onClick={async () => {
                  await setActiveAccount(account);
                  setSelectedAddress(account.address);
                }}
              >
                <UserBlock
                  user={account}
                  selected={isSameAccount(account, app.user.activeAccount)}
                  showRole={false}
                  showLoginMethod={true}
                  compact
                  hideAvatar
                />
              </div>
            );
          })}
        </>
      )}
      {activeAccounts.length > 0 && <CWDivider />}
      <div
        className="login-menu-item"
        onClick={() => {
          navigate(`/profile/id/${profileId}`, {}, null);
        }}
      >
        <CWText type="caption">View profile</CWText>
      </div>
      <div
        className="login-menu-item"
        onClick={() => {
          navigate(`/profile/edit`, {}, null);
        }}
      >
        <CWText type="caption">Edit profile</CWText>
      </div>
      <div
        className="login-menu-item"
        onClick={() => setIsLoginModalOpen(true)}
      >
        <CWText type="caption">Connect a new address</CWText>
      </div>
      <CWModal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </div>
  );
};
