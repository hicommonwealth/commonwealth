import app from 'state';
import { SPECIFICATIONS, TOKENS } from '../../../common/constants';
import { GroupResponseValuesType } from '../GroupForm/index.types';

// Makes create/edit group api payload from provided form submit values
export const makeGroupDataBaseAPIPayload = (
  formSubmitValues: GroupResponseValuesType
) => {
  const payload = {
    chainId: app.activeChainId(),
    address: app.user.activeAccount.address,
    groupName: formSubmitValues.groupName.trim(),
    groupDescription: (formSubmitValues.groupDescription || '').trim(),
    topicIds: formSubmitValues.topics.map((x) => parseInt(x.value)),
    requirementsToFulfill:
      formSubmitValues.requirementsToFulfill === 'ALL'
        ? formSubmitValues.requirements.length
        : formSubmitValues.requirementsToFulfill,
    requirements: [],
  };

  // map requirements and add to payload
  formSubmitValues.requirements.map((x) => {
    // for eth base
    if (
      x.requirementType === SPECIFICATIONS.ERC_20 ||
      x.requirementType === SPECIFICATIONS.ERC_721 ||
      x.requirementType === SPECIFICATIONS.ERC_1155 ||
      x.requirementType === TOKENS.EVM_TOKEN
    ) {
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: x.requirementAmount.trim(),
          source: {
            source_type: x.requirementType,
            evm_chain_id: parseInt(x.requirementChain),
            ...(x.requirementType !== TOKENS.EVM_TOKEN && {
              contract_address: x.requirementContractAddress.trim(),
            }),
            ...(x.requirementType === SPECIFICATIONS.ERC_1155 && {
              token_id: x.requirementTokenId.trim(),
            }),
          },
        },
      });
      return;
    }

    // for cosmos base
    if (x.requirementType === TOKENS.COSMOS_TOKEN) {
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: x.requirementAmount.trim(),
          source: {
            source_type: x.requirementType,
            cosmos_chain_id: x.requirementChain,
            token_symbol: 'COS',
          },
        },
      });
      return;
    }
  });

  return payload;
};
