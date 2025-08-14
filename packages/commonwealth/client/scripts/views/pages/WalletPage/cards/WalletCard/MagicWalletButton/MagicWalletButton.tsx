import { ValidChains } from '@hicommonwealth/evm-protocols';
import { WalletId } from '@hicommonwealth/shared';
import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useState } from 'react';
import { components } from 'react-select';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import useAuthentication from 'views/modals/AuthModal/useAuthentication';
import './MagicWalletButton.scss';

type MagicWalletButtonProps = {
  userSelectedAddress?: string;
};

const chainOptions = [
  {
    label: 'Ethereum Base',
    value: ValidChains.Base,
    icon: 'base' as IconName,
  },
  {
    label: 'Ethereum Mainnet',
    value: ValidChains.Mainnet,
    icon: 'ethereum' as IconName,
  },
] as const;

const MagicWalletButton = ({ userSelectedAddress }: MagicWalletButtonProps) => {
  const user = useUserStore();

  const { openMagicWallet } = useAuthentication({});
  const [selectedNetwork, setSelectedNetwork] = useState<{
    label: string;
    value: ValidChains;
    icon: IconName;
  }>(chainOptions[0]);
  const [open, setIsOpen] = useState(false);

  const isSelectedAddressMagic =
    user.addresses.find((a) => a.address === userSelectedAddress)?.walletId ===
    WalletId.Magic;

  if (isSelectedAddressMagic) return <></>;

  return (
    <div className="MagicWalletButton">
      <div className="button-container">
        <CWIcon iconName="magic" />
        <CWButton
          buttonType="secondary"
          buttonHeight="sm"
          buttonWidth="narrow"
          label="Manage Funds"
          onClick={() => {
            openMagicWallet(selectedNetwork.value).catch(console.error);
          }}
        />
        <CWSelectList
          components={{
            // eslint-disable-next-line react/no-multi-comp
            Option: (originalProps) => (
              <components.Option {...originalProps}>
                <CWIcon
                  // eslint-disable-next-line react/destructuring-assignment
                  iconName={originalProps.data.icon}
                  iconSize="small"
                />
                {/* eslint-disable-next-line react/destructuring-assignment */}
                {originalProps.data.label} ({originalProps.data.value})
              </components.Option>
            ),
          }}
          noOptionsMessage={() => ''}
          value={selectedNetwork}
          defaultValue={selectedNetwork}
          formatOptionLabel={(option) => (
            <ClickAwayListener onClickAway={() => setIsOpen(false)}>
              <div onClick={() => setIsOpen(!open)}>
                <CWIcon iconName={option.icon as any} iconSize="small" />
                <CWText type="caption">{option.label.split(' ').at(-1)}</CWText>
              </div>
            </ClickAwayListener>
          )}
          menuIsOpen={open}
          isClearable={false}
          isSearchable={false}
          options={chainOptions}
          onChange={(option) => {
            option && setSelectedNetwork(option);
            setIsOpen(false);
          }}
        />
      </div>
      <CWText type="caption">
        Buy, Send, and Receive funds for your magic wallet.
      </CWText>
    </div>
  );
};

export default MagicWalletButton;
