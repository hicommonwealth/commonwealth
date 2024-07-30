# Platform Coding Guidelines

Structuring code for the backend API.

## Contents

- [RESTful API](#restful-api)
  + [Problem](#problem)
  + [Solution + Guidelines](#solution--guidelines)
- [Route Handlers and Controllers](#route-handlers-and-controllers)
  + [Problem](#problem-1)
  + [Solution + Guidelines](#solution--guidelines-1)
  + [Route Handler](#route-handler)
  + [Controller](#controller)
  + [Method](#method)
  + [Wiring Up The Route](#wiring-up-the-route)
- [Testing](#testing)
- [Change Log](#change-log)

## RESTful API

### Problem

The problem with creating an API is that there are many possible ways to define an API endpoint. Different developers tend to use different conventions for the URL pattern, resulting in inconsistency across the API.

### Solution + Guidelines

By using RESTful API conventions, the API becomes predictable and intuitive for both internal and external developers who build clients for the API.

- Each API endpoint should use RESTful conventions:
  - ❌ `GET /getItems`
  - ❌ `POST /updateItem`
  - ✅ `GET /items`
  - ✅ `PATCH /items/3`
- When possible, all updates to an entity should use a single `PATCH` route:
  - ❌ `PUT /threads/3/title`
  - ❌ `PUT /threads/3/topic`
  - ❌ `PUT /threads/3/archived`
  - ✅ `PATCH /threads/3`
- Reference: <https://restfulapi.net/resource-naming/>

## Route Handlers and Controllers

### Problem

The straightforward approach for implementing a route is to simply add business logic directly into the route handler. The problem with that approach is that it results in business logic which is tightly coupled with the Express server, difficult to reuse, and difficult to write automated tests for.

### Solution + Guidelines

The chosen solution is for routes to use controllers as the way to access business logic. Controller classes are used in order to bucket business logic into logical domains (e.g. Threads, Comments, Reactions), and also to hold references to stateful objects (e.g. DB handle, TBC, banCache).

The stack for an API endpoint is: `Route -> Controller -> Method`

### Route Handler

```ts
// Example Route Handler
// > routes/items/get_item_handler.ts

type GetItemRequestParams = {
  itemId: string
}
type GetItemResponse = ItemAttributes;

export const getItemHandler = async (
  // controllers are passed into route handler function
  controllers: ServerControllers,
  req: TypedRequestParams<GetItemRequestParams>,
  res: TypedResponse<GetItemResponse>
) => {
  const { itemId } = req.params
  // use controller to invoke business logic
  const items = await controllers.items.getItem({ itemId });
  return items
};
```

A route handler is a function that is bound to a particular endpoint

- All route handlers should be stored at `server/routes/{entity}/{handler}.ts`
  - e.g. `server/routes/threads/get_threads_handler.ts`
    - Should use snake_case filename suffixed with `_handler.ts`
- Request types should be suffixed with `RequestParams`, `RequestQuery` or
`RequestBody`
  - For TS typing of the Request object, use one of the following
    - `TypedRequest<B, Q, P>`
    - `TypedRequestParams<P>`
    - `TypedRequestQuery<Q>`
    - `TypedRequestBody<B>`
- Response type should be suffixed with `Response`
- Route handlers should not directly contain business logic, but should use
controllers to invoke logic

### Controller

```ts
// Example Controller
// > controllers/server_items_controller.ts

export class ServerItemsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

  async getItem(options: GetItemOptions): Promise<GetItemResult> {
    return __getItem.call(this, options);
  }

  async updateItem(options: UpdateItemOptions): Promise<UpdateItemResult> {
    return __updateItem.call(this, options);
  }
}
```

A controller is a class that contains business logic

- Each controller file should be placed at
`server/controllers/server_{entity}_controller.ts`:
  - e.g. `server_items_controller.ts`
- Use explicit types for argument and return value
- Methods are invoked with `call` so that the `this` context is bound to the
function being called

### Method

```ts
// Example Method
// > controllers/server_items_methods/get_item.ts

export type GetItemOptions = {
  itemId: string
};

export type GetItemResult = ItemAttributes[];

export async function __getItem(
  this: ServerItemsController,
  { itemId }: GetItemOptions
): Promise<GetItemResult> {
  // access DB and other class variables via "this"
  const item = await this.models.Item.find({ id: itemId })
  return item
}
```

To prevent each controller file from becoming inconveniently long, method
logic should be placed in a seperate file (not inline in the class) at
`server/controllers/server_{entity}_methods/{method_name}.ts`

- Should use snake_case for method file
- Method name prefixed with two underscores, e.g. `__getItem` to indicate that this method is private and should not be imported anywhere except for the controller
- Method arguments (options) and return value (result) have explicit defined types
- Class should use dependency injection for common objects like TBC (passed via
constructor)
- Method argument type should have suffix `Options`
- Method return type should have suffix `Result`
- The first argument of the method should be `this: Server{Entity}Controller`
  - This is a special TS feature that defines the type for `this` in the
function
- Return type should be explicitly set, not inferred

### Wiring Up The Route

In the root router file, instantiate the controller and register the route:

```ts
// > routing/router.ts

const serverControllers: ServerControllers = {
    // ...
    items: new ServerItemsController(...) // instantiate controller here
};

// ...

registerRoute(
  router,
   'get',
  '/items/:itemId',
  getItemHandler.bind(this, serverControllers)
);
```

## Testing

Since the business logic is encapsulated in controller classes and decoupled from the server, controllers can be unit tested via mocking.

```ts
// Example controller unit test

describe('ServerItemsController', () => {
  describe('#getItem', async () => {
    // create mock objects for controller (must implement yourself!)
    const models: any = {};
    const tokenBalanceCache: any = {};
    const banCache: any = {};

    // pass mocked objects into controller
    const controller = new ServerGroupsController(
      models,
      tokenBalanceCache,
      banCache,
    );

    // invoke class method
    const result = await controller.getItem({
      id: 1
    });

    // make assertions
    expect(result).to.have.property('id', 1);
    expect(result).to.have.property('createdAt');
    expect(result).to.have.property('updatedAt');
  });
})
```

For logic which uses raw SQL queries, API tests provide stronger guarantees.

## Change Log

- 231016: Authored by Ryan Bennett (#5325).
