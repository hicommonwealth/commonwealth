import { isAddress } from 'web3-utils';
import type { ValidationStatus } from '../views/components/component_kit/cw_validation_text';

enum FormType {
  AddressRef = 'address-ref',
  Address = 'address',
  Token = 'token',
}
export function isValidEthAddress(address: string) {
  return isAddress(address);
}

function isValidToken(input: string) {
  const numberRegex = /^[1-9]\d*$/;
  return numberRegex.test(input);
}

export default function validateType(
  input: string,
  type: FormType,
): [ValidationStatus, string] | [] {
  switch (type) {
    case FormType.Address:
      if (isValidEthAddress(input)) {
        return [];
      } else {
        return ['failure', 'invalid address'];
      }
    case FormType.AddressRef:
      if (isValidEthAddress(input)) {
        return [];
      } else {
        return ['failure', 'invalid address'];
      }
    case FormType.Token:
      if (isValidToken(input)) {
        return [];
      } else {
        return ['failure', 'invalid address'];
      }
    default:
      return [];
  }
}
