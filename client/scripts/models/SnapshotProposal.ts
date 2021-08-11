class SnapshotProposal {
  public readonly ipfsHash: string;
  public readonly authorAddress: string;
  public readonly timestamp: number;
  public readonly start: number;
  public readonly end: number;
  public readonly snapshot: string;
  public readonly name: string;
  public readonly body: string;
  public readonly choices: string[];

  constructor({
    ipfsHash,
    authorAddress,
    timestamp,
    start,
    end,
    snapshot,
    name,
    body,
    choices,
  }) {
    this.ipfsHash = ipfsHash;
    this.authorAddress = authorAddress;
    this.timestamp = timestamp;
    this.start = start;
    this.end = end;
    this.snapshot = snapshot;
    this.name = name;
    this.body = body;
    this.choices = choices;
  }
}

export default SnapshotProposal;
