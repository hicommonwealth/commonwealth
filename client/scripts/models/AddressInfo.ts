class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public readonly keytype: string;

  constructor(id, address, chain, keytype) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.keytype = keytype;
  }
}

export default AddressInfo;
