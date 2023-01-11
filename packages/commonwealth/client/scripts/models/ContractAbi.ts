import moment from 'moment';

// Client model for ContractAbi
class ContractAbi {
  public readonly id: number;
  public readonly nickname?: string;
  public readonly abi: Array<Record<string, unknown>>;
  public readonly verified?: boolean;
  public readonly created_at?: moment.Moment;
  public readonly updated_at?: moment.Moment;
  public readonly is_factory?: boolean;
  public readonly create_dao_function_name?: string;
  public readonly create_dao_event_name?: string;
  public readonly create_dao_event_parameter?: string;

  constructor({
    id,
    nickname,
    abi,
    verified,
    createdAt,
    updatedAt,
    isFactory,
    createDaoFunctionName,
    createDaoEventName,
    createDaoEventParameter,
  }: {
    id: number;
    nickname?: string;
    abi: Array<Record<string, unknown>>;
    verified?: boolean;
    createdAt?: moment.Moment;
    updatedAt?: moment.Moment;
    isFactory?: boolean;
    createDaoFunctionName?: string;
    createDaoEventName?: string;
    createDaoEventParameter?: string;
  }) {
    this.id = id;
    this.nickname = nickname;
    this.abi = abi;
    this.verified = verified;
    this.created_at = createdAt;
    this.updated_at = updatedAt;
    this.is_factory = isFactory;
    this.create_dao_function_name = createDaoFunctionName;
    this.create_dao_event_name = createDaoEventName;
    this.create_dao_event_parameter = createDaoEventParameter;
  }

  public static fromJSON({
    id,
    nickname,
    abi,
    verified,
    createdAt,
    updatedAt,
    isFactory,
    createDaoFunctionName,
    createDaoEventName,
    createDaoEventParameter,
  }) {
    return new ContractAbi({
      id,
      nickname,
      abi,
      verified,
      createdAt,
      updatedAt,
      isFactory,
      createDaoFunctionName,
      createDaoEventName,
      createDaoEventParameter,
    });
  }
}

export default ContractAbi;
