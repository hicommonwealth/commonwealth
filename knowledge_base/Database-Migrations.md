# Best Practices

- Each migration should be an atomic change set, meaning no intermediate states, so that errors don't leave the database in a broken state.
- To ensure atomicity, migration should be transactionalized, so that the entire change set can roll back on error.
  - If your migration is weirdly hanging, check to ensure that the `{ transaction }` is being passed into the function call properly.
- All migrations should have corresponding `down()` functions, i.e. we should strive to ensure all migrations are properly reversible.
  - Migrations which for some reason cannot be reversed should have detailed explanations of why it cannot be reversed.
- For performance, avoid queries inside loops wherever possible. Try to perform all necessary reads in a single SQL query.

## Change Log

- 230320: Ownership transferred to Jake Naviaski.
- 230308: Authored by Alex Young.
