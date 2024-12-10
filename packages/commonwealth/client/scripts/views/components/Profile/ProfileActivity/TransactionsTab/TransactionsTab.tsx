import { WalletId } from '@hicommonwealth/shared';
import { formatAddressShort } from 'helpers';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import useAuthentication from '../../../../modals/AuthModal/useAuthentication';
import { CWIcon } from '../../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../../component_kit/cw_text';
import { CWButton } from '../../../component_kit/new_designs/CWButton';
import { CWSelectList } from '../../../component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../../component_kit/new_designs/CWTextInput';
import { FilterOptions } from '../types';
import MyTokens from './MyTokens';
import NoTransactionHistory from './NoTransactionHistory';
import TransactionsHistory from './TransactionHistory';
import './TransactionsTab.scss';
import useTransactionHistory from './useTransactionHistory';

const BASE_ADDRESS_FILTER = {
  label: 'All addresses',
  value: '',
};

type TransactionsTabProps = {
  transactionsType: 'tokens' | 'history';
};

const TransactionsTab = ({ transactionsType }: TransactionsTabProps) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    selectedAddress: BASE_ADDRESS_FILTER,
  });
  const user = useUserStore();
  const hasMagic = user.addresses?.[0]?.walletId === WalletId.Magic;

  const ADDRESS_FILTERS = [
    BASE_ADDRESS_FILTER,
    ...[...new Set(user.addresses.map((x) => x.address))].map((address) => ({
      label: formatAddressShort(address, 5, 6),
      value: address,
    })),
  ];

  const possibleAddresses = ADDRESS_FILTERS.filter((a) => a.value !== '').map(
    (a) => a.value,
  );

  // @ts-expect-error <StrictNullChecks/>
  let addressFilter = [filterOptions.selectedAddress.value];
  // @ts-expect-error <StrictNullChecks/>
  if (filterOptions.selectedAddress.value === '') {
    addressFilter = possibleAddresses;
  }

  const { openMagicWallet } = useAuthentication({});

  const data = useTransactionHistory({
    filterOptions,
    addressFilter,
  });

  return (
    <section className="TransactionsTab">
      <section className="filters">
        {hasMagic && (
          <div className="title-and-wallet-button">
            <CWButton
              label="Open wallet"
              onClick={() => {
                openMagicWallet().catch(console.error);
              }}
            />
          </div>
        )}
        <CWTextInput
          size="large"
          fullWidth
          placeholder="Search community name or symbol"
          containerClassName="search-input-container"
          inputClassName="search-input"
          iconLeft={<CWIcon iconName="search" className="search-icon" />}
          onInput={(e) =>
            setFilterOptions((options) => ({
              ...options,
              searchText: e.target.value?.trim(),
            }))
          }
        />
        <div className="select-list-container">
          <CWText fontWeight="medium">Filter</CWText>
          <CWSelectList
            isSearchable={false}
            isClearable={false}
            options={ADDRESS_FILTERS}
            value={filterOptions.selectedAddress}
            onChange={(option) =>
              // @ts-expect-error <StrictNullChecks/>
              setFilterOptions((filters) => ({
                ...filters,
                selectedAddress: option,
              }))
            }
          />
        </div>
      </section>

      {!(data?.length > 0) ? (
        <NoTransactionHistory
          withSelectedAddress={!!filterOptions?.selectedAddress?.value}
        />
      ) : (
        <>
          {transactionsType === 'tokens' && (
            <MyTokens transactions={data || []} />
          )}
          {transactionsType === 'history' && (
            <TransactionsHistory transactions={data || []} />
          )}
        </>
      )}
    </section>
  );
};

export { TransactionsTab };
