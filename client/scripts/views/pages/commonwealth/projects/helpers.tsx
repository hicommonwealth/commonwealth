import Web3 from 'web3';

// @Zak and @Gabe for PR review: Thoughts on this validation system, and documenting/standardizing?
// See logic in create_project_form inputValidationFn (on each text input) + final 'submit' button functionality,
// especially in conjunction with new `onsuccess` attr
export const validateProjectForm = (property: string, value: string) => {
  if (!value)
    return ['error', `Form is missing a ${property.split(/(?=[A-Z])/)} input.`];
  let errorMessage: string;
  switch (property) {
    case 'title':
      if (value.length < 8 || value.length > 64) {
        errorMessage = `Title must be valid string between 3 and 64 characters. Current count: ${value.length}`;
      }
      break;
    case 'shortDescription':
      if (value.length > 224) {
        errorMessage = `Input limit is 224 characters. Current count: ${value.length}`;
      }
      break;
    case 'token':
    case 'beneficiary':
    case 'creator':
      if (!Web3.utils.isAddress(value)) {
        errorMessage = `Invalid ${property} address. Must be a valid Ethereum address.`;
      }
      break;
    case 'fundraiseLength':
      // TODO: Min fundraiseLength check
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid fundraise length. Must be between [X, Y]';
      }
      break;
    case 'threshold':
      // TODO: Min threshold check
      if (Number.isNaN(+value)) {
        errorMessage = 'Invalid threshold amount. Must be between [X, Y]';
      }
      break;
    case 'curatorFee':
      if (Number.isNaN(+value) || +value > 100 || +value < 0) {
        errorMessage = `Curator fee must be a valid number (%) between 0 and 100.`;
      }
      break;
    default:
      break;
  }

  if (errorMessage) {
    return ['error', errorMessage];
  } else {
    return ['success', `Valid ${property}`];
  }
};
