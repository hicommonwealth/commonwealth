import type moment from 'moment';

class Template {
  public readonly id: number;
  public readonly abiId: number;
  public readonly name: string;
  public readonly template: string;
  public readonly createdBy?: string;
  public readonly description?: string;
  public readonly createdForCommunity?: string;
  public readonly createdAt?: moment.Moment;
  public readonly updatedAt?: moment.Moment;

  constructor({
    id,
    abiId,
    name,
    template,
    createdBy,
    description,
    createdForCommunity,
    createdAt,
    updatedAt,
  }: {
    id: number;
    abiId: number;
    name: string;
    template: string;
    createdBy?: string;
    description?: string;
    createdForCommunity?: string;
    createdAt?: moment.Moment;
    updatedAt?: moment.Moment;
  }) {
    this.id = id;
    this.abiId = abiId;
    this.name = name;
    this.template = template;
    this.createdBy = createdBy;
    this.description = description;
    this.createdForCommunity = createdForCommunity;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static fromJSON({
    id,
    abi_id,
    name,
    template,
    created_by,
    description,
    created_for_community,
    created_at,
    updated_at,
  }) {
    return new Template({
      id,
      abiId: abi_id,
      name,
      template,
      createdBy: created_by,
      description,
      createdForCommunity: created_for_community,
      createdAt: created_at,
      updatedAt: updated_at,
    });
  }
}

export default Template;
