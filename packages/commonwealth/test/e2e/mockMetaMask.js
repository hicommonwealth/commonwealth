
class MockMetaMaskProvider {

    constructor(host, pkey) {
      this.privateKey = pkey
      this.web3 = new Web3(new Web3.providers.HttpProvider(host))
      this.web3.defaultAccount = this.web3.eth.accounts.privateKeyToAccount(
        pkey
      ).address
      const getAccounts = async () => {
        return [this.web3.defaultAccount]
      }
      this.eth = { getAccounts: getAccounts() }
    }
  
    async signTypedData(data) {
      if (data[0] == this.web3.defaultAccount) {
        return signTypedData({
          privateKey: Buffer.from(this.privateKey.substring(2), "hex"),
          data: JSON.parse(data[1]),
          version: "V4"
        })
      }
    }
  
    async request(payload) {
      switch (payload.method) {
        case "eth_getBlockByNumber":
          return await this.web3.eth.getBlock("latest")
        case "eth_requestAccounts":
          return [this.web3.defaultAccount]
        case "wallet_switchEthereumChain":
          return this.web3.eth.getChainId()
        case "eth_signTypedData_v4":
          return this.signTypedData(payload.params)
        default:
          throw Error("method not supported by mock provider")
      }
    }
  }
  
const provider = new MockMetaMaskProvider('https://mainnet.infura.io/v3/17253b2fd784479abff55a32c9b3282c', '0x09187906d2ff8848c20050df632152b5b27d816ec62acd41d4498feb522ac5c3')
window.ethereum = provider
  