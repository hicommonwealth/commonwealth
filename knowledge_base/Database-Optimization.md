# Query Optimization

## Limit Columns and Data Pulled by Sequelize

When using Sequelize for database queries, it's important to limit the columns and data pulled from the database. This can improve query performance and reduce the amount of data transferred over the network. For example, in the `/viewSubscriptions` endpoint, consider fetching only the necessary columns and data required for the response. This can be achieved by specifying the attributes in the Sequelize query. Refer to the [GitHub issue comment](https://github.com/hicommonwealth/commonwealth/issues/3429#issuecomment-1552327071) for more details.

## Frequent Queries

For queries that are executed frequently, there may be a caching opportunity. If stale data is acceptable in these cases, you can implement caching by setting an appropriate Time To Live (TTL) and caching the query results. This can help reduce the load on the database and improve overall response times. An example of such a query is the `/viewGlobalActivity` endpoint. Determine the TTL for the cached data based on the data's volatility and update frequency.

## Slow Deletes

If you're experiencing slow deletes due to cascading foreign key constraints, consider refactoring the constraints to prevent the slow cascade delete. Slow deletes can occur when there are multiple levels of cascading deletes that need to be executed. To improve performance, review the foreign key constraints and adjust them accordingly. Refer to the [GitHub issue](https://github.com/hicommonwealth/commonwealth/issues/3437) for more information on how to handle slow deletes.

## Slow Reads

If you're encountering slow reads when querying JSONB attributes, it's recommended to avoid using JSONB attributes in the `WHERE` clause of your queries. This can result in slow query performance. Instead, consider storing the JSONB attribute as a separate column in the database and use that column for querying. By indexing the separate column, you can significantly improve the read performance. Refer to the [Stack Overflow post](https://stackoverflow.com/questions/71086258/query-on-json-jsonb-column-super-slow-can-i-use-an-index) for more details on optimizing JSONB attribute queries.

## Slow Inserts

If you're experiencing slow inserts due to calculating the maximum value every time a new entry is made, consider optimizing the insertion process. Calculating the maximum value can be an expensive operation, especially as the number of entries grows. Instead, you can store the maximum value separately and update it only when necessary. This can help improve the insert performance. Refer to the [GitHub issue](https://github.com/hicommonwealth/commonwealth/issues/3438) for more information on optimizing inserts involving maximum value calculation.

## Change Log

- 230627: Authored by Nakul Manchanda.
