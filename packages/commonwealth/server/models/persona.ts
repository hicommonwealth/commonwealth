import { DataTypes, Model } from 'sequelize';
import Sequelize from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type PersonaAttributes = {
  id: number;
  name: string;
  personality: string;
  jwt?: string;
  last_visited?: Date;
  public_key?: string;
  private_key?: string;
  collection_name?: string;
  karma?: number;

  created_at?: Date;
  updated_at?: Date;
};

export type PersonaInstance = ModelInstance<PersonaAttributes>;
export type PersonaModelStatic = ModelStatic<PersonaInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): PersonaModelStatic => {
  const Persona = <PersonaModelStatic>sequelize.define(
    'Persona',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: dataTypes.STRING, allowNull: false },
      personality: { type: dataTypes.STRING, allowNull: false },
      jwt: { type: dataTypes.STRING, allowNull: true },
      last_visited: { type: dataTypes.DATE, allowNull: true },
      public_key: { type: dataTypes.STRING, allowNull: true },
      private_key: { type: dataTypes.STRING, allowNull: true },
      collection_name: { type: dataTypes.STRING, allowNull: true },
      karma: { type: dataTypes.INTEGER, defaultValue: 0, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Personas',
      indexes: [{ fields: ['name'] }],
    }
  );

  return Persona;
};
