## Migrations

When adding or changing models in the database, we write migrations so
that the production database gets updated smoothly when code using
the new models goes live.

The main reference for how to run migrations is here:
https://sequelize.org/master/manual/migrations.html


### Writing and running migrations

Migrations use the queryInterface object to perform operations on tables. The
queryInterface documentation covers how to use most of those functions:
https://sequelize.org/master/class/lib/query-interface.js~QueryInterface.html

Here are some example migrations:
- createTable: server/migrations/20190510184156-setup.js
- addColumn: server/migrations/20190620211103-add-pinned-threads.js
- changeColumn: server/migrations/20200204055813-allow-offchain-reaction-to-have-null-chain.js

Important operations to be aware of are:
- `npx sequelize migration:generate --name=create-addresses`
- `npx sequelize db:migrate`
- `npx sequelize db:migrate:undo`


### Transactions

Multi-step migrations should be written using `queryInterface.sequelize.transaction`.
Each operation within the migration must have this transaction object passed to it.

Doing this will prevent migrations from failing in a half-complete state in production,
which will cause downtime and may cause data loss.


## Custom SQL

More complex operations will need to be written as custom SQL, using
`queryInterface.sequelize.query`. This is best documented by example:

Modifying the values of an existing column in-place, using the SQL for `SET x = REPLACE`:
server/migrations/20190510211053-update_object_id.js

Querying existing data in the database (simple):
server/migrations/20191224174226-add-address-keytype.js

Query existing data in the database, and then using it to conduct a bulkInsert (advanced):
server/migrations/20200311224232-populate-memberships-for-existing-users.js