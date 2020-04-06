class AddressInfo {
  public readonly address: string;
  public readonly chain: string;
  public selected: boolean;
  public readonly keytype: string;

  constructor(address, chain, selected, keytype) {
    this.address = address;
    this.chain = chain;
    this.selected = selected;
    this.keytype = keytype;
  }
}

export default AddressInfo;
