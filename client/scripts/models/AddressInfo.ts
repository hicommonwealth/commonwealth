class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public readonly keytype: string;
  public readonly isMagic: boolean;
  public readonly ghostAddress: boolean;

  constructor(id, address, chain, keytype, isMagic?, ghostAddress?) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.keytype = keytype;
    this.isMagic = !!isMagic;
    this.ghostAddress = !!ghostAddress;
  }
}

export default AddressInfo;
