class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public selected: boolean;
  public readonly keytype: string;

  constructor(id, address, chain, selected, keytype) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.selected = selected;
    this.keytype = keytype;
  }
}

export default AddressInfo;
