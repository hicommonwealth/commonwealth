import React from 'react';
import CWDateTimeInput from 'views/components/component_kit/CWDateTimeInput';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { KyoFinanceChainIdsType } from '../../types';
import { SpecialCaseDynamicFieldsProps } from '../types';

const KYOFinanceSwapFields = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_kyo_finance_swap_metadata) {
    return <></>;
  }

  return (
    <>
      <CWDateTimeInput
        key={`metadata-minTimestamp-${defaultValues?.action}`}
        name="metadata-minTimestamp"
        label="Min Timestamp"
        // minDate={new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000)} // TODO: 11963 - malik - do we need this?
        // maxDate={new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000)} // TODO: 11963 - malik - do we need this?
        containerClassName="span-3"
        fullWidth
        {...(defaultValues?.metadata?.minTimestamp && {
          selected: new Date(defaultValues?.metadata?.minTimestamp),
        })}
        onChange={(value) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              minTimestamp: value?.toISOString(),
            },
          })
        }
        customError={errors?.metadata?.minTimestamp}
      />
      <CWTextInput
        key={`metadata-outputToken-${defaultValues?.action}`}
        name="metadata-outputToken"
        label="Output Token"
        placeholder="0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F"
        containerClassName="span-3"
        fullWidth
        {...(defaultValues?.metadata?.outputToken && {
          defaultValue: defaultValues?.metadata?.outputToken,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              outputToken: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.outputToken}
      />
      <CWTextInput
        key={`metadata-inputToken-${defaultValues?.action}`}
        name="metadata-inputToken"
        label="Input Token"
        placeholder="0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F"
        containerClassName="span-3"
        fullWidth
        {...(defaultValues?.metadata?.inputToken && {
          defaultValue: defaultValues?.metadata?.inputToken,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              inputToken: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.inputToken}
      />
      <CWTextInput
        key={`metadata-minOutputAmount-${defaultValues?.action}`}
        name="metadata-minOutputAmount"
        label="Min Output Amount"
        placeholder="0.0001 ETH"
        containerClassName="span-3"
        fullWidth
        {...(defaultValues?.metadata?.minOutputAmount && {
          defaultValue: defaultValues?.metadata?.minOutputAmount,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              minOutputAmount: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.minOutputAmount}
      />
      <CWTextInput
        key={`metadata-minVolumeUSD-${defaultValues?.action}`}
        name="metadata-minVolumeUSD"
        label="Min Volume USD"
        placeholder="$100"
        containerClassName="span-3"
        fullWidth
        {...(defaultValues?.metadata?.minVolumeUSD && {
          defaultValue: defaultValues?.metadata?.minVolumeUSD,
        })}
        onInput={(e) =>
          onChange?.({
            metadata: {
              ...(defaultValues?.metadata || {}),
              chainId: defaultValues?.metadata
                ?.chainId as KyoFinanceChainIdsType,
              minVolumeUSD: e?.target?.value?.trim(),
            },
          })
        }
        customError={errors?.metadata?.minVolumeUSD}
      />
    </>
  );
};

export default KYOFinanceSwapFields;
