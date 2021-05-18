class OffchainAttachment {
  public readonly url: string;
  public readonly description: string;

  constructor(url: string, description: string) {
    this.url = url;
    this.description = description;
  }
}

export default OffchainAttachment;
