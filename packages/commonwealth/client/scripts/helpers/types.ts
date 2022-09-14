export class AbiInput {
  public readonly internalType: string;
  public readonly name: string;
  public readonly type: string;
  constructor(internalType: string, name: string, type: string) {
      this.name = name;
      this.type = type;
      this.internalType = internalType;
  }
  static fromJSON(json) {
      return new AbiInput(json.internalType, json.name, json.type);
  }
}

export class AbiOutput {
    public readonly internalType: string;
    public readonly name: string;
    public readonly type: string;
    constructor(internalType: string, name: string, type: string) {
        this.name = name;
        this.type = type;
        this.internalType = internalType;
    }
    static fromJSON(json) {
        return new AbiOutput(json.internalType, json.name, json.type);
    }
}

export class AbiFunction {
    public readonly inputs: AbiInput[];
    public readonly name: string;
    public readonly outputs: AbiOutput[];
    public readonly stateMutability: string;
    public readonly type: string;
    constructor(inputs: AbiInput[], name: string, outputs: AbiOutput[],
      stateMutability: string, type: string) {
        this.name = name;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
        this.stateMutability = stateMutability;
    }
    static fromJSON(json) {
        return new AbiFunction(json.name, json.type, json.inputs, json.outputs,
          json.stateMutability);
    }
}

export class AbiEvent {
  public anonymous: boolean;
  public inputs: AbiInput[];
  public name: string;
  public type: string;
  public constructor(anonymous: boolean, inputs: AbiInput[], name: string, type: string) {
    this.anonymous = anonymous;
    this.inputs = inputs;
    this.name = name;
    this.type = type;
  }
}

export enum Network {
    Mainnet = "Mainnet",
    Rinkeby = "Rinkeby",
    Ropsten = "Ropsten",
    Kovan = "Kovan",
    Goerli = "Goerli",
  }

export const networkIdToName = {
    1: Network.Mainnet,
    3: Network.Ropsten,
    4: Network.Rinkeby,
    5: Network.Goerli,
    42: Network.Kovan,
};

export const networkNameToId = {
    [Network.Mainnet]: 1,
    [Network.Ropsten]: 3,
    [Network.Rinkeby]: 4,
    [Network.Goerli]: 5,
    [Network.Kovan]: 42,
};