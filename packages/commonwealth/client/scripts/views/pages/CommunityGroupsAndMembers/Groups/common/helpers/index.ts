import app from 'state';
import { userStore } from 'state/ui/user';
import {
  CW_SPECIFICATIONS,
  ERC_SPECIFICATIONS,
  SOL_NFT_SPECIFICATION,
  SPL_SPECIFICATION,
  TOKENS,
} from '../../../common/constants';
import { convertRequirementAmountFromTokensToWei } from '../../../common/helpers';
import { AllowListGroupFilters } from '../GroupForm/Allowlist/index.types';
import { GroupResponseValuesType } from '../GroupForm/index.types';

// Makes create/edit group api payload from provided form submit values
export const makeGroupDataBaseAPIPayload = (
  formSubmitValues: GroupResponseValuesType,
  allowedAddresses?: string[],
) => {
  // @ts-expect-error StrictNullChecks
  const extraRequrirements = allowedAddresses?.length > 0 ? 1 : 0;
  const payload = {
    communityId: app.activeChainId() || '',
    address: userStore.getState().activeAccount?.address || '',
    groupName: formSubmitValues.groupName.trim(),
    groupDescription: (formSubmitValues.groupDescription || '').trim(),
    groupImageUrl: formSubmitValues.groupImageUrl || '',
    topics: formSubmitValues.topics,
    requirementsToFulfill:
      formSubmitValues.requirementsToFulfill === 'ALL'
        ? // @ts-expect-error StrictNullChecks
          formSubmitValues.requirements.length + extraRequrirements
        : formSubmitValues.requirementsToFulfill,
    requirements: [],
  };

  // @ts-expect-error StrictNullChecks
  if (allowedAddresses?.length > 0) {
    // @ts-expect-error StrictNullChecks
    payload.requirements.push({
      rule: 'allow',
      data: { allow: allowedAddresses },
    });
  }

  // map requirements and add to payload
  // @ts-expect-error StrictNullChecks
  formSubmitValues.requirements.map((x) => {
    // for eth base
    if (
      x.requirementType === ERC_SPECIFICATIONS.ERC_20 ||
      x.requirementType === ERC_SPECIFICATIONS.ERC_721 ||
      x.requirementType === ERC_SPECIFICATIONS.ERC_1155 ||
      x.requirementType === TOKENS.EVM_TOKEN
    ) {
      // @ts-expect-error StrictNullChecks
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            x.requirementType as any,
            // @ts-expect-error StrictNullChecks
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            // @ts-expect-error StrictNullChecks
            evm_chain_id: parseInt(x.requirementChain),
            ...(x.requirementType !== TOKENS.EVM_TOKEN && {
              // @ts-expect-error StrictNullChecks
              contract_address: x.requirementContractAddress.trim(),
            }),
            ...(x.requirementType === ERC_SPECIFICATIONS.ERC_1155 && {
              // @ts-expect-error StrictNullChecks
              token_id: x.requirementTokenId.trim(),
            }),
          },
        },
      });
      return;
    }

    // for spl base
    if (
      x.requirementType === SPL_SPECIFICATION ||
      x.requirementType === SOL_NFT_SPECIFICATION
    ) {
      // @ts-expect-error StrictNullChecks
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            x.requirementType,
            // @ts-expect-error StrictNullChecks
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            solana_network: x.requirementChain,
            is_nft: x.requirementType === SOL_NFT_SPECIFICATION,
            // @ts-expect-error StrictNullChecks
            contract_address: x.requirementContractAddress.trim(),
          },
        },
      });
      return;
    }

    // for sui base
    if (x.requirementType === TOKENS.SUI_TOKEN) {
      // @ts-expect-error StrictNullChecks
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            x.requirementType as any,
            // @ts-expect-error StrictNullChecks
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            sui_network: x.requirementChain,
            ...(x.requirementContractAddress && {
              object_id: x.requirementContractAddress.trim(),
            }),
          },
        },
      });
      return;
    }

    // for sui token with custom coinType
    if (x.requirementType === TOKENS.SUI_TOKEN_TYPE) {
      // @ts-expect-error StrictNullChecks
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            x.requirementType as any,
            // @ts-expect-error StrictNullChecks
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            sui_network: x.requirementChain,
            // @ts-expect-error StrictNullChecks
            coin_type: x.requirementCoinType.trim(),
          },
        },
      });
      return;
    }

    // for cosmos base
    if (
      x.requirementType === TOKENS.COSMOS_TOKEN ||
      x.requirementType === CW_SPECIFICATIONS.CW_721 ||
      x.requirementType === CW_SPECIFICATIONS.CW_20
    ) {
      // @ts-expect-error StrictNullChecks
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            x.requirementType as any,
            // @ts-expect-error StrictNullChecks
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            cosmos_chain_id: x.requirementChain,
            ...(x.requirementType !== TOKENS.COSMOS_TOKEN && {
              // @ts-expect-error StrictNullChecks
              contract_address: x.requirementContractAddress.trim(),
            }),
            ...(x.requirementType === TOKENS.COSMOS_TOKEN && {
              token_symbol: 'COS',
            }),
          },
        },
      });
      return;
    }
  });

  return payload;
};

export const getTotalPages = (
  members,
  allowedAddresses: string[],
  filter: AllowListGroupFilters | undefined,
  membersPerPage: number,
) => {
  let totalPages = members?.totalPages ?? 0;

  if (filter === 'allow-specified-addresses') {
    totalPages = Math.ceil(allowedAddresses.length / membersPerPage);
  } else if (filter === 'not-allow-specified-addresses') {
    totalPages =
      totalPages - Math.ceil(allowedAddresses.length / membersPerPage);
  }

  return totalPages;
};
