# Backend File Structure

Since we are using TRPC, we follow RPC conventions. The route is accessed on <NAMESPACE>.<PROCEDURE>. Here:
- NAMESPACE: This signifies the entity on which the action is performed, defining the scope or category of the action.
- PROCEDURE: This specifies the action itself, detailing what operation is being carried out on the identified entity.

When constructing an API, we utilize three key resources:

- Router: This establishes the API's interface and includes metadata about its structure.
- Schema: This outlines the input and output types that the API processes.
- Procedure: This coordinates the request validation and business logic associated with the API request.

For further definition, let:
- Handler: This is part of the procedure. It encapsulates the business logic associated with the API.

The code is structure as follows:
```
├── commonwealth
│   ├── server
│   │   ├── trpc
│   │   │   ├── resources
│   │   │   │   ├── <NAMESPACE>
│   │   │   │   │   ├── <NAMESPACE>Router.ts
│   │   │   │   │   ├── procedures
│   │   │   │   │   │   ├── <PROCEDURE>Procedure.ts
├── common-common
│   ├── src
│   │   ├── schemas
│   │   │   ├── <NAMESPACE>
│   │   │   │   ├── <PROCDURE>Schema.ts
```

- <NAMESPACE>Router.ts: Unique file in namespace. This defines the routing aspect, which url paths will point to which procedures
- <PROCEDURE>Procedure.ts: One of many files in namespace. This implements how the server will handle the procedure calls
- <PROCDURE>Schema.ts: One of many files in namespace. This describes the zod schema that will be used for input/output validation

# Design Decisions
### Schemas go in common-common
This is so that we can use these schemas on the front end for things like form validation.

### Handler not in separate file from Procedure
This is due to a performance constraint. If the handler goes in a separate file and is imported form procedures,
then we will need to use z.infer from the schema in the handler. This will slow down the IDE over time as this is
extra overhead on the language server. Instead it is better to infer the type from the trpc procedure chain.

### No "Success" field in Response
It is clearer to separate concerns by utilizing the HTTP status code instead. So any successful response will be a 2XX status
code. Any unsuccessful response will be of either the 4XX or 5XX variety. Note that these status codes should not be
handled manually, as instead they are automatically set by TRPC.