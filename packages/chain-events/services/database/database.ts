import ChainEntityFactory, {
  ChainEntityModelStatic,
} from './models/chain_entity';
import ChainEventFactory, { ChainEventModelStatic } from './models/chain_event';
import ChainEventTypeFactory, {
  ChainEventTypeModelStatic,
} from './models/chain_event_type';
import { Sequelize, DataTypes } from "sequelize";
import { DATABASE_URI } from "../config";
import { factory, formatFilename } from 'common-common/src/logging';

export type Models = {
  ChainEntity: ChainEntityModelStatic;
  ChainEvent: ChainEventModelStatic;
  ChainEventType: ChainEventTypeModelStatic;
}

export interface DB extends Models {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}

const log = factory.getLogger(formatFilename(__filename));

export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    process.env.NODE_ENV === 'test'
      ? false
      : (msg) => {
        log.trace(msg);
      },
  dialectOptions:
    process.env.NODE_ENV !== 'production'
      ? {
        requestTimeout: 40000,
      }
      : {
        requestTimeout: 40000,
        ssl: { rejectUnauthorized: false },
      },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

const models: Models = {
  ChainEntity: ChainEntityFactory(sequelize, DataTypes),
  ChainEvent: ChainEventFactory(sequelize, DataTypes),
  ChainEventType: ChainEventTypeFactory(sequelize, DataTypes),
}

const db: DB = {
  sequelize,
  Sequelize,
  ...models,
};

// setup associations
Object.keys(models).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

export default db;
