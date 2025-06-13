import React from 'react';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { KyoFinanceChainIdsType } from '../../types';
import { SpecialCaseDynamicFieldsProps } from '../types';
import KYOFinanceLpFields from './KYOFinanceLpFields';
import KYOFinanceSwapFields from './KYOFinanceSwapFields';

const KYOFinanceFields = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (
    !(
      config?.requires_kyo_finance_swap_metadata ||
      config?.requires_kyo_finance_lp_metadata
    )
  ) {
    return <></>;
  }

  const communityChainNodeSelectInputOptions = [
    { value: 1868, label: 'Soneium Mainnet' },
    { value: 1946, label: 'Soneium Testnet' },
  ];

  return (
    <>
      <CWSelectList
        isClearable={true}
        backspaceRemovesValue
        key={`metadata-chainId-${defaultValues?.action}`}
        name="metadata-chainId"
        label="KYO Chain Node"
        placeholder="Select a KYO supported chain node"
        containerClassname={
          config?.requires_kyo_finance_lp_metadata ? 'span-6' : 'span-3'
        }
        options={communityChainNodeSelectInputOptions}
        onChange={(newValue) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: newValue?.value as KyoFinanceChainIdsType,
            },
          })
        }
        {...(defaultValues?.metadata?.chainId && {
          value: {
            value: parseInt(`${defaultValues?.metadata?.chainId}`),
            label: `${
              communityChainNodeSelectInputOptions?.find(
                (x) =>
                  x.value === parseInt(`${defaultValues?.metadata?.chainId}`),
              )?.label
            }`,
          },
        })}
        customError={errors?.metadata?.chainId}
      />
      <KYOFinanceSwapFields
        defaultValues={defaultValues}
        errors={errors}
        onChange={onChange}
        config={config}
      />
      <KYOFinanceLpFields
        defaultValues={defaultValues}
        errors={errors}
        onChange={onChange}
        config={config}
      />
    </>
  );
};

export default KYOFinanceFields;
