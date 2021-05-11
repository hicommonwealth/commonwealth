class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public readonly keytype: string;
  public readonly isMagic: boolean;

  constructor(id, address, chain, keytype?, isMagic?) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.keytype = keytype;
    this.isMagic = !!isMagic;
  }
}

export default AddressInfo;
