import { CWTextArea } from 'client/scripts/views/components/component_kit/cw_text_area';
import React from 'react';
import { KyoFinanceChainIdsType } from '../../types';
import { SpecialCaseDynamicFieldsProps } from '../types';

const KYOFinanceLpFields = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_kyo_finance_lp_metadata) {
    return <></>;
  }

  return (
    <>
      <CWTextArea
        key={`metadata-poolAddresses-${defaultValues?.action}`}
        name="metadata-poolAddresses"
        label="Pool Addresses"
        // TODO: malik - is this fine?
        placeholder="0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F, 0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F, ...."
        containerClassName="span-6"
        {...(defaultValues?.metadata?.poolAddresses && {
          defaultValue: defaultValues?.metadata?.poolAddresses,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              poolAddresses: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.poolAddresses}
        instructionalMessage="Addresses must be comma(,) separated"
      />
      <CWTextArea
        key={`metadata-minUSDValues-${defaultValues?.action}`}
        name="metadata-minUSDValues"
        label="USD Values (Min)"
        // TODO: malik - is this fine?
        placeholder="0.9, 9000, ...."
        containerClassName="span-6"
        {...(defaultValues?.metadata?.minUSDValues && {
          defaultValue: defaultValues?.metadata?.minUSDValues,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              minUSDValues: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.minUSDValues}
        instructionalMessage="USD values must be comma(,) separated"
      />
    </>
  );
};

export default KYOFinanceLpFields;
