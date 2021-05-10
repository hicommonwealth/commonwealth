class SnapshotProposal {
	public readonly ipfsHash: string;
	public readonly authorAddress: string;
	public readonly timestamp: string;
	public readonly start: string;
	public readonly end: string;
	public readonly name: string;
	public readonly body: string;
	public readonly sig: string;
	public readonly authorIpfsHash: string;
	public readonly relayerIpfsHash: string;

	constructor(ipfsHash, authorAddress, timestamp, start, end, name, body, sig, authorIpfsHash, relayerIpfsHash) {
		this.ipfsHash = ipfsHash;
		this.authorAddress = authorAddress;
		this.timestamp = timestamp;
		this.start = start;
		this.end = end;
		this.name = name;
		this.body = body;
		this.sig = sig;
		this.authorIpfsHash = authorIpfsHash;
		this.relayerIpfsHash = relayerIpfsHash;
	}
}

export default SnapshotProposal;