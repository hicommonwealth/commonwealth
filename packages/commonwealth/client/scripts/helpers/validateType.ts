import type { ValidationStatus } from '../views/components/component_kit/cw_validation_text';

enum FormType {
  AddressRef = "address-ref",
  Address = "address",
  Token = "token"
}
function isValidEthAddress(address: string): ValidationStatus {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/; 
  if(ethAddressRegex.test(address)){
    return "success"
  } else {
    return "failure"
  }
}

function isValidToken(input: string): ValidationStatus {
  const numberRegex = /^[0-9]+([.][0-9]+)?$/; 
  if (numberRegex.test(input)) {
    return "success"
  } else {
    return "failure"
  }
}
  
export default function validateType(input: string, type: FormType): [ValidationStatus, string] {  
  switch (type) {
    case FormType.Address:
      return [isValidEthAddress(input), input];
    case FormType.AddressRef:
      return [isValidEthAddress(input), input];
    case FormType.Token:
      return [isValidToken(input), input]
    default:
     return ["success", input]
  }
}


