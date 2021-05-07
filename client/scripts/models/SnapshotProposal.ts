class SnapshotProposal {
	public readonly address: string;
	public readonly timestamp: string;
	public readonly start: string;
	public readonly end: string;
	public readonly name: string;
	public readonly body: string;
	public readonly sig: string;
	public readonly authorIpfsHash: string;
	public readonly relayerIpfsHash: string;

	constructor(address, timestamp, start, end, name, body, sig, authorIpfsHash, relayerIpfsHash) {
		this.address = address;
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