# Platform Coding Guidelines

Guidelines for structuring code for the backend API

### RESTful API
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
- Reference: https://restfulapi.net/resource-naming/

### Route Handlers
- A route handler is a function that is bound to a particular endpoint
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
controllers to invoke logic:
```ts
// Example Route Handler

type GetItemRequestParams = {
  itemId: string
}
type GetItemResponse = ItemAttributes;

export const getItemHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<GetItemRequestParams>,
  res: TypedResponse<GetItemResponse>
) => {
  const { itemId } = req.params
  const items = await controllers.items.getItem({ itemId });
  return items
};
```


### Controllers
- A controller is a class that contains business logic
- Each controller file should be placed at
`server/controllers/server_{entity}_controller.ts`:
  - e.g. `server_items_controller.ts`
- To prevent each controller file from becoming inconveniently long, method
logic should be placed in a seperate file (not inline in the class) at
`server/controllers/server_{entity}_methods/{method_name}.ts`
  - Should use snake_case for method file
  - Method name prefixed with two underscores, e.g. `__getItem`
  - Methods are invoked with `call` so that the `this` context is bound to the
function being called
  - Method arguments (options) and return value (result) use explicit typing,
not inferred
    - These types originate from the method file
- Class should use dependency injection for common objects like TBC (passed via
constructor)
```ts
// Example Controller
// > controllers/server_items_controller.ts

export class ServerItemsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

  async getItems(options: GetItemsOptions): Promise<GetItemsResult> {
    return __getItems.call(this, options);
  }

  async updateItem(options: UpdateItemOptions): Promise<UpdateItemResult> {
    return __updateItem.call(this, options);
  }
}
```

```ts
// Router File
// > routing/router.ts
const serverControllers: ServerControllers = {
    ...
    items: new ServerItemsController(...) // instantiate controller here
};
```

### Methods

- Method argument type should have suffix `Options`
- Method return type should have suffix `Result`
- The first argument of the method should be `this: Server{Entity}Controller`
  - This is a special TS feature that defines the type for `this` in the
function
- Return type should be explicitly specified, not inferred

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
  const item = this.models.Item.find({ id: itemId })
  return item
}

```

