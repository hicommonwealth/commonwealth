# Tools

_This entry serves as a bucket entry for documenting libraries and tools employed in the codebase._

## Contents

- [Zod](#zod)
- [Change Log](#change-log)

## Zod

As of 231024, we are moving toward Zod as a unified back- and frontend solution for schema validation. For legacy support reasons, external routes may present an exception, and continue using Express Validator instead.

For route validation, our current pattern is to `import z from 'zod'`, construct schemas via `z.object()`, and validate our request queries against these schemas using `schema.safeParse(req)`. The `safeParse()` method is used over `parse()`, which will throw an error if validation fails. Instead, if  the `safeParse` result (e.g. `validationResult`) `=== false`, we throw our own custom `AppError`.

## Change Log

- 231024: Authored by Graham Johnson.
