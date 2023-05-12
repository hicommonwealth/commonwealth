import { useCommonNavigate } from 'navigation/helpers';
import useForceRerender from 'hooks/useForceRerender';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { setActiveAccount } from 'controllers/app/login';
import { redraw } from 'mithrilInterop';
import { UserBlock } from 'views/components/user/user_block';
import { isSameAccount, pluralize } from 'helpers';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { Modal } from 'views/components/component_kit/cw_modal';
import { SelectAddressModal } from 'views/modals/select_address_modal';
import { LoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';

import 'components/Header/LoginSelectorMenu.scss';

type LoginSelectorMenuLeftAttrs = {
  nAccountsWithoutRole: number;
};

export const LoginSelectorMenuLeft = ({
  nAccountsWithoutRole,
}: LoginSelectorMenuLeftAttrs) => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSelectAddressModalOpen, setIsSelectAddressModalOpen] =
    useState(false);
  const [profileId, setProfileId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const changeSelectedAddress = () => {
    const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
    setSelectedAddress(activeAccount.address);
    forceRerender();
  };

  useEffect(() => {
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

  useEffect(() => {
    const activeAccount = app.user.activeAccount ?? app.user.addresses[0];
    const chain =
      typeof activeAccount.chain === 'string'
        ? activeAccount.chain
        : activeAccount.chain?.id;
    const profile = app.newProfiles.getProfile(chain, activeAccount.address);
    setProfileId(profile.id);
    setSelectedAddress(activeAccount.address);
  }, []);

  const { activeAccounts } = app.user;

  return (
    <div className="LoginSelectorMenu left">
      {app.activeChainId() && (
        <>
          <CWText type="caption" className="title">
            Select address to use
          </CWText>
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
                  redraw();
                }}
              >
                <UserBlock
                  user={account}
                  selected={isSameAccount(account, app.user.activeAccount)}
                  showRole={false}
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
        onClick={() => {
          if (nAccountsWithoutRole > 0) {
            setIsSelectAddressModalOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      >
        <CWText type="caption">
          {nAccountsWithoutRole > 0
            ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
            : 'Connect a new address'}
        </CWText>
      </div>
      <Modal
        content={
          <SelectAddressModal
            onModalClose={() => setIsSelectAddressModalOpen(false)}
          />
        }
        onClose={() => setIsSelectAddressModalOpen(false)}
        open={isSelectAddressModalOpen}
      />
      <Modal
        content={<LoginModal onModalClose={() => setIsLoginModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsLoginModalOpen(false)}
        open={isLoginModalOpen}
      />
    </div>
  );
};
