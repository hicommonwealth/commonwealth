# Sequelize

_For database migration best practices, see [Database-Migrations](./Database-Migrations.md)._

## Contents

- [Overview](#overview)
- [Overall Structure](#overall-structure)
  * [Database Initialization](#database-initialization)
  * [Models Folder](#models-folder)
  * [Migrations Folder](#migrations-folder)
- [Model Definition](#model-definition)
  * [The Model File](#the-model-file)
  * [Defining the Model](#defining-the-model)
    + [Attributes](#attributes)
    + [Options](#options)
    + [Associations](#associations)
- [Change Log](#change-log)

## Overview

We currently use sequelize as an ORM for managing our relationship with our postgres backend. This page aims to collect information regarding the current structure and best practices around sequelize.

For a deeper dive into sequelize itself, see the [v6 docs](https://sequelize.org/docs/v6/).

## Overall Structure

### Database Initialization

The [database.ts](../blob/master/packages/commonwealth/server/database.ts) file contains several important initialization items:

1. the `sequelize` variable initializes a connection to the database on server startup, via the `DATABASE_URI` environment variable. On Heroku, this is set automatically to the database connected to the deployment. See [environment variables](https://github.com/hicommonwealth/commonwealth/wiki/Environment-Variables) for more details.
2. The `models` variable is a record of Model factories, used to generate Sequelize `Models`, which represent tables in the database. Any reference to e.g. `models.Address.create()` is invoking a function on the `Address` model, representing the underlying `Addresses` table (note the automatic pluralization applied by sequelize -- for more information, see [model definition](#model-definition)). This variable must match the type `Models` declared in [models.ts](../blob/master/packages/commonwealth/server/models.ts).
3. The `db` variable is the top-level export for accessing the database. It must match the type `DB` declared in [models.ts](../blob/master/packages/commonwealth/server/models.ts).

### Models Folder

Each model, representing a database table, must be defined in its own file in the [models folder](../blob/master/packages/commonwealth/server/models/). See [Model Definition](#model-definition) for details on how to define a model.

### Migrations Folder

Database Migrations are a series of date-prefixed that implement updates to the database schema. Each change to a model must be accompanied by a corresponding migration. A fresh, timestamped migration file can be generated locally using `npx sequelize migration:generate --name <name-of-migration>`. Best practices for writing migrations can be found [here](https://github.com/hicommonwealth/commonwealth/wiki/Database-Migrations).

Migration state is tracked in a `SequelizeMeta` database table, which is a list of the filenames of all migrations that have been run against the current database. If any files exist in the [migrations folder](../blob/master/packages/commonwealth/server/migrations/) which are not present in the `SequelizeMeta` table, the `npx sequelize db:migrate` function will run them in alphanumeric order (hence the timestamp prefix). The migrate function is run automatically on Heroku deployment, or can be run locally using `pnpm migrate-db`.

Migrations can be reversed, if a `down()` function is defined, by running `npx sequelize db:migrate:undo`. On running the undo command, Sequelize will attempt to run the `down()` function of the most recent row in the `SequelizeMeta` table. In this way, the state of the database schema can be moved back and forth between changes to the schema. However, some migrations cannot be reversed, and the file must be present in order to reverse a migration, so ensure that down migrations are run before pushing changes which may remove the underlying migration file.

**WARNING: _migrations update the actual state of the database_. If updates to model definitions do not match the changes made to the database by migrations, bugs may occur when performing Sequelize operations.**

## Model Definition

### The Model File

A model definition consists of the following parts:

1. `Attributes` type: a Typescript representation of the table schema. May optionally include other Attributes objects as fields, if related by foreign key association. _Definition constraint: all required fields are necessary for successful `create()` call, i.e. row insertion. All other fields must be optional (e.g. sequences, nullable values, values with defaults), even if required in the table schema itself._
2. `Instance` type: a Typescript representation of an existing database row. Typically only includes mixin functions for querying other instances via foreign key relation. Accepts the `Attributes` type as a type argument.
3. `ModelStatic` type: a Typescript representation of the `Model`, i.e. the table itself. Used as return type for the Model Factory function. Accepts the `Instance` as type argument. Extending to add table-wide helpers is not considered good practice.
4. Model Factory function: a function that accepts a `Sequelize` object, i.e. an active database connection, and a `DataTypes` object, i.e. the Sequelize library, and returns a `Model`. The body of this function includes a [model definition](#defining-the-model) and an `associate()` function, which initializes associations with other models at database initialization time. **This function is the default export of a model file**, and is used as the Factory function in the [database.ts initializer](#database-initialization).

### Defining the Model

In our model files, we expose a factory function, which defines the model. Models themselves are defined using Sequelize's `define()` call, followed by an `associate()` call which defines associations. `define()` first takes a model name (should be the same as the file name, capitalized), then a set of attributes, followed by an options object.

#### Attributes

`Attributes` define the columns of the Table as an object `{ column_name: { configuration } }`. The following configuration keys are commonly used:

- `type`: a mandatory field defining the type of the column. This should map onto the type defined in the `Attributes` object earlier in the file. Commonly used types: `INTEGER`, `STRING`, `DATE`, `BOOLEAN`, `JSONB` (binary-encoded JSON blob). [Sequelize docs for more info](https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types).
- `primaryKey`: true if the field is the primary key.
- `autoIncrement`: used with `primaryKey` to rely on an integer sequence for automatically defining row primary keys. Note that the primary key will need to be optional in the `Attributes` type if `autoIncrement` is true (as it cannot be passed into the `create()` call).
- `allowNull`: if true, the field can be `null`. Should be optional in the `Attributes` type.
- `defaultValue`: defines the default value for the field. Should be optional in the `Attributes` type.

#### Options

The `ModelOptions` type in Sequelize defines the possible options, but we tend to use the following settings:

- `tableName` allows for specifying the table name in the database, which should be the pluralized model name (e.g. `Address` becomes `Addresses`).
- `timestamps: true` means the database will maintain creation and update times in the columns specified in the `createdAt` and `updatedAt` (and `deletedAt` if `paranoid: true`) options.
- `createdAt: 'created_at'` and `updatedAt: 'updated_at'` tracks the creation and update times. Define the attributes as follows:

    ```js
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    ```

- `underscored: true` converts camelCased column names to underscored in the database.
- `indexes` defines an array of indexes e.g. `[ { fields: ['address', 'chain'], unique: true } ... ]`.
- `defaultScope: { attributes: { exclude: ['verification_token', ...] } }` excludes the list of columns from the data returned by sequelize queries. This is used to hide private data such as identifying information.
- `scopes: { withPrivateData: {} }` is the conventional way to define an additional `withPrivateData` scope that allows access to all columns. Example of invoking the scope: `models.Address.scope('withPrivateData').findOne(...)`. Used to read or modify sensitive data.

#### Associations

The associate function is our convention for declaring associations between tables. This takes place after table definition.

Sequelize supports four different types of associations (see [docs](https://sequelize.org/docs/v6/core-concepts/assocs/)): `belongsTo`, `hasOne`, `belongsToMany`, and `hasMany`. By convention, we define foreign keys as `other_table_id`.

Example of an explicit association:

```js
models.Address.belongsTo(models.User, {
  foreignKey: 'user_id',
  targetKey: 'id',
});
```

Sequelize supports many-to-many associations via "through tables", where a third table stores many-to-many relationship mappings between two tables. Sequelize supports this directly via the `through` syntax, e.g.:

```js
models.Address.belongsToMany(models.Thread, {
  through: models.Collaboration,
  as: 'collaboration',
});
```

**The use of new through tables for many-to-many associations is discouraged. Documentation here is for legacy purposes.**

## Change Log

- 230320: Authored by Jake Naviasky.
