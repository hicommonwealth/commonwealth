import React from 'react';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

import { fetchCachedNodes } from 'state/api/nodes';

const ChainEventFields = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_chain_event) return <></>;

  const ethereumChains = fetchCachedNodes()?.filter(
    (chainNode) => !!chainNode.ethChainId && chainNode.alchemyMetadata,
  );

  const ethereumChainOptions = ethereumChains
    ?.map((chainNode) => ({
      value: chainNode.ethChainId as number,
      label: `${chainNode.name} - ${chainNode.ethChainId}`,
    }))
    ?.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <>
        <CWSelectList
          key={`ethChainId-${defaultValues?.action}`}
          name="ethChainId"
          isClearable={false}
          label="Ethereum Chain"
          placeholder="Select a chain"
          options={ethereumChainOptions}
          onChange={(newValue) =>
            newValue && onChange?.({ ethChainId: `${newValue.value}` })
          }
          {...(defaultValues?.ethChainId && {
            value: {
              value: parseInt(`${defaultValues?.ethChainId}`),
              label: `${
                ethereumChains?.find(
                  (x) =>
                    x.ethChainId === parseInt(`${defaultValues?.ethChainId}`),
                )?.name
              } - ${defaultValues.ethChainId}`,
            },
          })}
          customError={errors?.ethChainId}
          containerClassname="span-3" // this layout comes from QuestActionSubForm.scss
        />
        <CWTextInput
          key={`contractAddress-${defaultValues?.action}`}
          name="contractAddress"
          label="Contract Address"
          placeholder="0x5C69bEe701ef814a2B6a3EDD4B2A6b45b6f72f2F"
          fullWidth
          {...(defaultValues?.contractAddress && {
            defaultValue: defaultValues?.contractAddress,
          })}
          onInput={(e) =>
            onChange?.({ contractAddress: e?.target?.value?.trim() })
          }
          customError={errors?.contractAddress}
          containerClassName="span-3" // this layout comes from QuestActionSubForm.scss
        />

        <CWTextArea
          key={`transactionHash-${defaultValues?.action}`}
          name="transactionHash"
          label="Transaction Hash"
          placeholder="0xd2b4b1d70d7f76d55b524ea788ab85e9ab2d01d99ebbeedfb0b69ab0735bc5c9"
          {...(defaultValues?.transactionHash && {
            value: defaultValues?.transactionHash,
          })}
          onInput={(e) =>
            onChange?.({ transactionHash: e?.target?.value?.trim() })
          }
          customError={errors?.transactionHash}
          containerClassName="span-3" // this layout comes from QuestActionSubForm.scss
        />
        <CWTextArea
          key={`eventSignature-${defaultValues?.action}`}
          name="eventSignature"
          label="Event Signature"
          placeholder="event Transfer(address indexed from, address indexed to, uint256 value)"
          {...(defaultValues?.eventSignature && {
            value: defaultValues?.eventSignature,
          })}
          onInput={(e) =>
            onChange?.({ eventSignature: e?.target?.value?.trim() })
          }
          customError={errors?.eventSignature}
          containerClassName="span-3" // this layout comes from QuestActionSubForm.scss
        />
      </>
    </>
  );
};

export default ChainEventFields;
