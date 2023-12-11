# Sequelize

### WhereOptions

Always use `WhereOptions` with the attributes of the relevant model when defining
a `where` object outside of the Sequelize query.

**Don't do this**
```typescript
const where = { id: 10 };
const result = await models.Community.findAll({
  where
});
```

**Do this instead**

```typescript
import WhereOptions from 'sequelize';
import {CommunityAttributes } from 'server/models/community';

const where: WhereOptions<CommunityAttributes> = {
  id: 10
};
const result = await models.Community.findAll({
  where
});
```

### AttributesOf and AttributeOf

If you need to list out or specify a specific attribute from a model, use the AttributesOf or AttributeOf
function so that if the underlying column is ever updated, a type error will be thrown if
the reference is not updated.

**Don't do this**

```typescript
const result = await models.Address.findAll({
  attributes: [
    'id', 
    'address',
    [
      fn('DISTINCT', col('id')),
      'distinctAddress',
    ],
  ]
});
```

**Do this instead**

```typescript
import { AddressAttributes } from 'server/models/address';
import { attributesOf, attributeOf } from 'server/util/sequelizeHelpers';

const result = await models.Address.findAll({
  attributes: [
    ...attributesOf<AddressAttributes>(
      'id',
      'address'
    ),
    [
      fn('DISTINCT', col(attributeOf<AddressAttributes>('id'))),
      'distinctAddress',
    ],
  ]
});
```

### Raw Queries

Always properly type the return value of your raw SELECT sequelize queries. This facilitates
model updates since an error will be thrown if a model is updated but a raw query
isn't.

**Don't do this**

```typescript
const result = await models.sequelize.query(`
  SELECT id FROM "Communities";
`, { type: QueryTypes.SELECT, raw: true });
```

**Do this**

```typescript
import { CommunityAttributes } from 'server/models/community';

const result = await models.Sequelize.query<Pick<CommunityAttributes, 'id'>>(`
  SELECT id FROM "Communities";
`, { type: QueryTypes.SELECT, raw: true });
```

**Or this**

If your raw query includes many different models it may be easier to directly reference the attributes
on the result object rather than providing a type for the `query` generic.

```typescript

import { CommunityAttributes } from 'server/models/community';

const result: { 
  id: CommunityAttributes['id'], 
  eth_chain_id: ChainNodeAttributes['eth_chain_id']
} = await models.Sequelize.query(`
  SELECT C.id, CN.eth_chain_id
  FROM "Communities" C
  JOIN "ChainNodes" CN ON C.chain_node_id = CN.id;
`, { type: QueryTypes.SELECT, raw: true });
```

### Mirror Checks

If you need to enforce a complex constraint on a specific column or set of columns in PostgreSQL,
mirror the PostgreSQL `CHECK` constraint in Sequelize. For example, if this is your check constraint:
```sql
ALTER TABLE "ContractAbis"
    ADD CONSTRAINT chk_contract_abi_array
        CHECK (jsonb_typeof(abi) = 'array');
```

Then on the "ContractAbis" sequelize model definition you can add a validation function like this:

```typescript
{
  ...,
  validate: {
    validAbi() {
      if (!Array.isArray(this.abi)) {
        throw new Error(
          `Invalid ABI. The given ABI of type ${typeof this.abi} is not a valid array.`
        )
      }
    }
  }
}
```

This prevents an entire database round-trip and ensures that CHECKS are properly documented 
in the Sequelize models themselves.

More info: https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/#validators


### Use Hooks

If you need to execute the same logic after a specific Sequelize lifecycle event use hooks!
For example, if you need to populate a record property based off of another property before
the Sequelize validation functions execute, use the `beforeValidate` hook.


```typescript
{
  ...,
  hooks: {
    beforeValidate(instance: ContractAbiInstance) {
      if (!instance.abi_hash) {
        instance.abi_hash = hashAbi(instance.abi)
      }
    }
  }
}
```

More info: https://sequelize.org/docs/v6/other-topics/hooks/

### 




