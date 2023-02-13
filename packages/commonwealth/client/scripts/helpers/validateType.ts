enum FormType {
  Address = "address",
  Token = "token"
}
function isValidEthAddress(address: string): boolean {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/; 
  return ethAddressRegex.test(address);
}

function isValidToken(input: string): boolean {
  const numberRegex = /^[0-9]+([.][0-9]+)?$/; 
  return numberRegex.test(input);
}

export default function validateType(input: string, type: FormType): boolean {  
  switch (type) {
    case FormType.Address:
      return isValidEthAddress(input);
    case FormType.Token:
      return isValidToken(input);
    default:
      
  }
}


