**Contents**

- [API Pagination Standard](#api-pagination-standard)
  * [Request Query Params](#request-query-params)
  * [Limit/Offset vs Cursor Pagination](#limit-offset-vs-cursor-pagination)
  * [Code Implementation](#code-implementation)
  * [Response Body](#response-body)
- [Change Log](#change-log)

# API Pagination Standard

⭐️ The goal of this document is to provide a standard pattern for pagination to be implemented across all routes of the Commonwealth API.

## Request Query Params

⭐️ The following query params should be used:

| Parameter | Description | Type | Example | Note
| ------ | ------ | ------ | ------ | ------ |
| `limit` | Page size | number | `10` |
| `page` | Page number | number | `3` |
| `order_by` | Column to sort by | string | `rank` | May be computed column instead of actual DB column name
| `order_direction` | Direction to sort | string | `ASC` or `DESC`

Additional Notes:

- All pagination-related query params should be optional
- Sensible default values should be provided

## Limit/Offset vs Cursor Pagination

⭐️ For consistency, we should use limit/offset for ALL routes, unless a special exception needs to be made for performance reasons.

Cursor based pagination is more performant than limit/offset pagination, particularly as the offset increases. (<https://shopify.engineering/pagination-relative-cursors>)

However, `ts_rank_cd` is used in some queries to perform text search and sort by a computed rank column. Using cursor-based pagination with a computed column can result in inconsistent pagination results. It's also not very efficient since computed columns are not indexed. Cursor-based pagination works best on indexed columns with unique and sequential rows.

## Code Implementation

The existing utility functions should be used for both ORM queries and raw SQL queries.

⭐️ Sequelize ORM example:

```js
import { formatPagination } from '../util/queries';

const paginationOptions = {
    limit: 10,
    page: 3
}

// spread the `formatPagination` result into the sequelize options
const result = await models.Comment.count({
  where: {
    …
  },
  ...formatPagination(paginationOptions),
});
```

⭐️ Raw SQL example:

```js
import { buildPaginationSql } from '../util/queries';

// creates `paginationSort` sql string and `paginationBind` for bind options
const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
  limit: 10,
  page: 3,
  orderBy: '"Threads".created_at',
  orderDirection: 'DESC',
});

// adds `paginationSort` to WHERE clause
const sqlQuery = `SELECT … FROM "Threads" WHERE ${paginationSort}`

// passes `paginationBind` to the query operation
const result = await models.sequelize.query(sqlQuery, {
  bind: paginationBind,
  type: QueryTypes.SELECT
})
```

## Response Body

⭐️ The response body of the request should contain pagination info, since it will help reduce the state complexity of the client side.

Use `TypedPaginationResult<T>`, which has the following shape:

```ts
{
    results: [
        // items of type T
    ],
    limit: 10,
    page: 3,
    totalPages: 25,
    totalResults: 247,
}
```

## Change Log

- 231027: Fixed code typo + added response body type.
- 230714: Authored by Ryan Bennett.
