# tanstack-api-generator

Automatic code generation library for TanStack Query v5+ that eliminates manual boilerplate. Generate fully-typed React Query hooks, query keys, fetchers, and invalidation helpers from a simple typed configuration object.

## Features

- 🎯 **Zero Boilerplate** - Define your API once, get fully-typed hooks automatically
- 🔒 **Type-Safe** - Complete TypeScript inference from configuration to hooks
- ⌨️ **Full Autocompletion** - Request bodies, query parameters, and responses all typed
- 🔑 **Smart Query Keys** - Deterministic, hierarchical keys following TanStack Query v5 standards
- ♻️ **Auto Invalidation** - Mutations automatically invalidate related queries
- 🎣 **Flexible Interceptors** - Add authentication, logging, or custom headers easily
- ✅ **Request & Response Validation** - Runtime type safety with Zod schemas
- 📦 **Tiny Bundle** - Minimal runtime overhead beyond TanStack Query itself

## Installation

```bash
npm install tanstack-api-generator @tanstack/react-query
# or
yarn add tanstack-api-generator @tanstack/react-query
# or
pnpm add tanstack-api-generator @tanstack/react-query
```

Optional: Install Zod for runtime validation

```bash
npm install zod
```

## Quick Start

### 1. Define Your API Configuration

```typescript
import { createQueryAPI } from "tanstack-api-generator";

// Minimal configuration - just define your endpoints
const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
      get: { method: "GET", path: "/users/:id" },
      create: { method: "POST", path: "/users" },
      update: { method: "PUT", path: "/users/:id" },
      delete: { method: "DELETE", path: "/users/:id" },
    },
    posts: {
      list: { method: "GET", path: "/posts" },
      get: { method: "GET", path: "/posts/:id" },
    },
  } as const,
  {
    baseURL: "https://api.example.com",
  }
);
```

> **Note:** The `as const` assertion is required for full type inference. The second parameter (fetch config) is optional - you can start with just the endpoint configuration. See the [Zero-Config Philosophy](#zero-config-philosophy) section below for more details.

### 2. Use Generated Hooks in Your Components

```typescript
import { api } from "./api";

function UserList() {
  // GET requests become useQuery hooks
  const { data: users, isLoading } = api.users.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

function UserDetail({ userId }: { userId: string }) {
  // Path parameters are automatically typed
  const { data: user } = api.users.get.useQuery({ id: userId });

  return <div>{user?.name}</div>;
}

function CreateUser() {
  // POST/PUT/PATCH/DELETE become useMutation hooks
  const createUser = api.users.create.useMutation();

  const handleSubmit = (name: string) => {
    createUser.mutate({ body: { name } });
  };

  return <button onClick={() => handleSubmit("John")}>Create User</button>;
}
```

That's it! No manual hook creation, no query key management, no invalidation logic needed.

> **💡 Pro Tip:** Add `bodySchema` and `querySchema` to your endpoints for full TypeScript autocompletion on request bodies and query parameters. See [Request and Response Typing](#request-and-response-typing) for details.

## Core Concepts

### Zero-Config Philosophy

The library is designed to work with minimal configuration. You only need to define your endpoints - everything else has sensible defaults:

```typescript
// Minimal - works out of the box
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
} as const);

// With optional baseURL
const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
    },
  } as const,
  { baseURL: "https://api.example.com" }
);
```

### API Configuration

Define your API endpoints using a simple configuration object:

```typescript
const config = {
  [group]: {
    [endpoint]: {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      path: "/path/with/:params",
      schema: zodSchema, // Optional Zod validation
    },
  },
} as const;
```

**Important**: Use `as const` to enable full type inference.

### Path Parameters

Path parameters are automatically extracted and typed:

```typescript
const api = createQueryAPI({
  users: {
    get: { method: "GET", path: "/users/:id" },
    posts: { method: "GET", path: "/users/:userId/posts/:postId" },
  },
} as const);

// TypeScript enforces parameter types
api.users.get.useQuery({ id: "123" }); // ✅
api.users.get.useQuery({ id: 123 }); // ✅
api.users.get.useQuery(); // ❌ Error: missing required parameter

api.users.posts.useQuery({ userId: "1", postId: "2" }); // ✅
```

### Query Keys

Query keys are automatically generated following TanStack Query v5 standards:

```typescript
// Access query keys for manual cache operations
const listKey = api.users.list.key(); // ['users', 'list']
const getKey = api.users.get.key({ id: "123" }); // ['users', 'get', { id: '123' }]

// Use with queryClient
queryClient.invalidateQueries({ queryKey: listKey });
```

### Automatic Invalidation

Mutations automatically invalidate related queries:

```typescript
const createUser = api.users.create.useMutation();
const updateUser = api.users.update.useMutation();
const deleteUser = api.users.delete.useMutation();

// POST mutations invalidate list queries
createUser.mutate({ body: { name: "John" } });
// Automatically invalidates: api.users.list

// PUT/PATCH mutations invalidate list and specific item
updateUser.mutate({ params: { id: "123" }, body: { name: "Jane" } });
// Automatically invalidates: api.users.list and api.users.get({ id: '123' })

// DELETE mutations invalidate list and specific item
deleteUser.mutate({ params: { id: "123" } });
// Automatically invalidates: api.users.list and api.users.get({ id: '123' })
```

### Manual Invalidation

For more control, use manual invalidation utilities:

```typescript
// Invalidate specific endpoint
await api.users.invalidate.list();
await api.users.invalidate.get({ id: "123" });

// Invalidate entire group
await api.users.invalidate.all();
```

## Common Use Cases

### Fetching a List of Items

```typescript
function UserList() {
  const { data, isLoading, error } = api.users.list.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Fetching a Single Item with Parameters

```typescript
function UserProfile({ userId }: { userId: string }) {
  // Path parameters are fully typed
  const { data: user } = api.users.get.useQuery({ id: userId });

  return <div>{user?.name}</div>;
}
```

### Creating a New Item

```typescript
function CreateUserForm() {
  const createUser = api.users.create.useMutation({
    onSuccess: (newUser) => {
      console.log("Created:", newUser);
      // List query is automatically invalidated!
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUser.mutate({
      body: {
        name: formData.get("name"),
        email: formData.get("email"),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

### Updating an Existing Item

```typescript
function EditUser({ userId }: { userId: string }) {
  const { data: user } = api.users.get.useQuery({ id: userId });
  const updateUser = api.users.update.useMutation();

  const handleUpdate = (name: string) => {
    updateUser.mutate({
      params: { id: userId },
      body: { name },
    });
    // Both list and detail queries are automatically invalidated!
  };

  return (
    <div>
      <input
        defaultValue={user?.name}
        onBlur={(e) => handleUpdate(e.target.value)}
      />
    </div>
  );
}
```

### Deleting an Item

```typescript
function DeleteUserButton({ userId }: { userId: string }) {
  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      console.log("User deleted");
      // Both list and detail queries are automatically invalidated!
    },
  });

  return (
    <button
      onClick={() => deleteUser.mutate({ params: { id: userId } })}
      disabled={deleteUser.isPending}
    >
      Delete
    </button>
  );
}
```

### Conditional Queries

```typescript
function UserProfile({ userId }: { userId: string | null }) {
  // Only fetch when userId is available
  const { data: user } = api.users.get.useQuery(
    { id: userId! },
    {
      enabled: !!userId,
    }
  );

  return user ? <div>{user.name}</div> : <div>No user selected</div>;
}
```

### Polling and Refetching

```typescript
function LiveUserList() {
  const { data: users } = api.users.list.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
  });

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Advanced Usage

### Authentication with Interceptors

The `beforeRequest` interceptor lets you modify requests before they're sent. This is perfect for adding authentication:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  beforeRequest: async (config) => {
    // Get token from your auth system
    const token = await getAuthToken();

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  },
});
```

**Real-world example with localStorage:**

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  beforeRequest: async (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }

    return config;
  },
});
```

### Response Transformation and Logging

The `afterResponse` interceptor lets you transform or log responses:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  afterResponse: async (response) => {
    // Log all API calls
    console.log(`[API] ${response.status} ${response.url}`);

    // Handle global error cases
    if (response.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }

    return response;
  },
});
```

**Advanced error handling:**

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  afterResponse: async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    return response;
  },
});
```

### Request and Response Typing

Get complete type safety for both request bodies and response data with automatic TypeScript inference.

#### Response Typing with `schema`

Add Zod schemas for runtime type safety and automatic validation of API responses:

```typescript
import { z } from "zod";

// Define your schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      schema: z.array(UserSchema), // Validates array of users
    },
    get: {
      method: "GET",
      path: "/users/:id",
      schema: UserSchema, // Validates single user
    },
    create: {
      method: "POST",
      path: "/users",
      schema: UserSchema, // Validates created user response
    },
  },
} as const);

// TypeScript knows the exact shape of data
const { data } = api.users.list.useQuery();
// data is typed as Array<{ id: string; name: string; email: string; createdAt: string }>
```

**Benefits of response schemas:**

- Runtime type safety - catch API contract violations
- Automatic type inference - no need to manually type responses
- Data transformation - Zod can coerce and transform data
- Validation errors - get detailed error messages when validation fails

#### Request Body Typing with `bodySchema`

Type your request bodies for POST, PUT, and PATCH requests with full autocompletion:

```typescript
import { z } from "zod";

// Define request body schema
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).optional(),
});

const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // Request body validation
      schema: UserSchema, // Response validation
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      bodySchema: UpdateUserSchema, // Request body validation
      schema: UserSchema, // Response validation
    },
  },
} as const);

// Full TypeScript autocompletion for request body!
const createUser = api.users.create.useMutation();

createUser.mutate({
  body: {
    name: "John Doe", // ✅ Autocompleted
    email: "john@example.com", // ✅ Autocompleted
    age: 30, // ✅ Autocompleted and optional
    // invalidProp: true // ❌ TypeScript error: property doesn't exist
  },
});

// With path parameters and body
const updateUser = api.users.update.useMutation();

updateUser.mutate({
  params: { id: "123" }, // ✅ Typed from path
  body: {
    name: "Jane Doe", // ✅ Autocompleted
    email: "jane@example.com", // ✅ Autocompleted
  },
});
```

**Benefits of bodySchema:**

- Full TypeScript autocompletion in your IDE
- Compile-time type checking - catch errors before runtime
- Runtime validation - ensure data matches schema before sending
- No manual type casting needed
- Prevents sending invalid data to your API

#### Query Parameter Typing with `querySchema`

Type your query parameters for GET requests with full autocompletion:

```typescript
import { z } from "zod";

// Define query parameter schema
const UserFilterSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).optional(),
});

const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      querySchema: UserFilterSchema, // Query params validation
      schema: z.array(UserSchema), // Response validation
    },
  },
} as const);

// Full TypeScript autocompletion for query parameters!
const { data: users } = api.users.list.useQuery({
  name: "John", // ✅ Autocompleted
  page: 1, // ✅ Autocompleted
  limit: 10, // ✅ Autocompleted
  sortBy: "name", // ✅ Autocompleted with enum values
  // invalid: true // ❌ TypeScript error: property doesn't exist
});

// Query params are included in the query key for proper caching
const key = api.users.list.key({ name: "John", page: 1 });
// ['users', 'list', { name: 'John', page: 1 }]
```

**Benefits of querySchema:**

- Full TypeScript autocompletion for query parameters
- Type-safe filtering and pagination
- Automatic query key generation with params
- Runtime validation of query parameters
- Prevents invalid query parameters

#### Complete Example with All Typing Features

```typescript
import { z } from "zod";

// Define all schemas
const UserFilterSchema = z.object({
  search: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  age: z.number().min(0).optional(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number(),
  createdAt: z.string(),
});

// Create fully-typed API
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      querySchema: UserFilterSchema, // Query params typed
      schema: z.array(UserSchema), // Response typed
    },
    get: {
      method: "GET",
      path: "/users/:id",
      schema: UserSchema, // Response typed
    },
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // Request body typed
      schema: UserSchema, // Response typed
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      bodySchema: UpdateUserSchema, // Request body typed
      schema: UserSchema, // Response typed
    },
  },
} as const);

// Use with full type safety
function UserManagement() {
  // Typed query with query parameters
  const { data: users } = api.users.list.useQuery({
    search: "john",
    page: 1,
    limit: 10,
  });

  // Typed mutation with body
  const createUser = api.users.create.useMutation();

  // Typed mutation with params and body
  const updateUser = api.users.update.useMutation();

  const handleCreate = () => {
    createUser.mutate({
      body: {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      },
    });
  };

  const handleUpdate = (userId: string) => {
    updateUser.mutate({
      params: { id: userId },
      body: {
        name: "Jane Doe",
      },
    });
  };

  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>
          {user.name} - {user.email}
          <button onClick={() => handleUpdate(user.id)}>Update</button>
        </div>
      ))}
      <button onClick={handleCreate}>Create User</button>
    </div>
  );
}
```

#### Validation is Optional

You can use the library without schemas - data will be typed as `unknown`:

```typescript
// Without schemas - data is typed as `unknown`
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
    create: { method: "POST", path: "/users" },
  },
} as const);

// You can still use it, just without runtime validation
const { data } = api.users.list.useQuery();
// data is `unknown` - you'll need to type it yourself

const createUser = api.users.create.useMutation();
createUser.mutate({ body: userData }); // body is `unknown`
```

### Combining Interceptors and Validation

Here's a complete real-world example combining authentication, logging, and validation:

```typescript
import { z } from "zod";

// Define schemas
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Create API with all features
const api = createQueryAPI(
  {
    users: {
      list: {
        method: "GET",
        path: "/users",
        schema: z.array(UserSchema),
      },
      get: {
        method: "GET",
        path: "/users/:id",
        schema: UserSchema,
      },
      create: {
        method: "POST",
        path: "/users",
        schema: UserSchema,
      },
    },
  } as const,
  {
    baseURL: "https://api.example.com",
    headers: {
      "Content-Type": "application/json",
    },
    beforeRequest: async (config) => {
      // Add authentication
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Log outgoing requests
      console.log(`[API Request] ${config.method} ${config.url}`);

      return config;
    },
    afterResponse: async (response) => {
      // Log responses
      console.log(`[API Response] ${response.status} ${response.url}`);

      // Handle auth errors globally
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/login";
      }

      return response;
    },
  }
);

// Now use it with full type safety and validation
function UserList() {
  const { data: users } = api.users.list.useQuery();
  // users is fully typed and validated!

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

### Custom Headers

Add default headers to all requests:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key",
    "X-Client-Version": "1.0.0",
  },
});
```

### TanStack Query Options

Pass any TanStack Query options to hooks:

```typescript
// useQuery options
const { data } = api.users.list.useQuery(undefined, {
  staleTime: 5000,
  refetchOnWindowFocus: false,
  enabled: isAuthenticated,
});

// useMutation options
const createUser = api.users.create.useMutation({
  onSuccess: (data) => {
    console.log("User created:", data);
  },
  onError: (error) => {
    console.error("Failed to create user:", error);
  },
});
```

### Custom QueryClient

Provide your own QueryClient instance:

```typescript
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
    },
  },
});

const api = createQueryAPI(config, fetchConfig, queryClient);
```

## API Reference

### `createQueryAPI(config, fetchConfig?, queryClient?)`

Creates a fully-typed API client with auto-generated hooks.

**Parameters:**

- `config` - API configuration object defining all endpoints
- `fetchConfig` (optional) - Fetch wrapper configuration
- `queryClient` (optional) - Custom QueryClient instance

**Returns:** Generated API object with typed hooks, keys, and utilities

### `FetchConfig`

Configuration for the fetch wrapper:

```typescript
type FetchConfig = {
  baseURL?: string;
  headers?: Record<string, string>;
  beforeRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  afterResponse?: (response: Response) => Response | Promise<Response>;
};
```

### `EndpointConfig`

Configuration for a single endpoint:

```typescript
type EndpointConfig = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  schema?: z.ZodSchema; // Response validation and type inference
  bodySchema?: z.ZodSchema; // Request body validation (POST/PUT/PATCH only)
  querySchema?: z.ZodSchema; // Query parameter validation and type inference
};
```

**Property Details:**

- `method` - HTTP method for the endpoint
- `path` - URL path with optional parameters (e.g., `/users/:id`)
- `schema` (optional) - Zod schema for response validation and TypeScript type inference
- `bodySchema` (optional) - Zod schema for request body validation and type inference
  - Only valid for POST, PUT, and PATCH methods
  - Provides full TypeScript autocompletion for mutation bodies
  - Validates request data before sending
- `querySchema` (optional) - Zod schema for query parameter validation and type inference
  - Typically used with GET requests
  - Provides full TypeScript autocompletion for query parameters
  - Automatically included in query keys for proper caching

## Error Handling

Errors are automatically mapped to structured error objects:

```typescript
const { error } = api.users.get.useQuery({ id: "123" });

if (error) {
  console.log(error.status); // HTTP status code
  console.log(error.statusText); // Status text
  console.log(error.message); // Error message
  console.log(error.data); // Response data if available
}
```

## Troubleshooting Type Errors

### Common TypeScript Errors and Solutions

#### Error: "Property does not exist on type"

**Problem:** Trying to access a property that doesn't exist in your schema.

```typescript
const { data: user } = api.users.get.useQuery({ id: "123" });
console.log(user.invalidProperty); // ❌ Error: Property 'invalidProperty' does not exist
```

**Solution:** Check your schema definition and ensure the property exists:

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  // Add the missing property
  invalidProperty: z.string().optional(),
});
```

#### Error: "Argument of type X is not assignable to parameter of type Y"

**Problem:** Passing incorrect type to mutation body or query parameters.

```typescript
createUser.mutate({
  body: {
    name: "John",
    age: "30", // ❌ Error: Type 'string' is not assignable to type 'number'
  },
});
```

**Solution:** Match the type defined in your schema:

```typescript
createUser.mutate({
  body: {
    name: "John",
    age: 30, // ✅ Correct type
  },
});
```

#### Error: "Property 'X' is missing in type"

**Problem:** Required property is missing from request body.

```typescript
createUser.mutate({
  body: {
    name: "John",
    // ❌ Error: Property 'email' is missing
  },
});
```

**Solution:** Add the required property or make it optional in your schema:

```typescript
// Option 1: Add the required property
createUser.mutate({
  body: {
    name: "John",
    email: "john@example.com", // ✅ Added required property
  },
});

// Option 2: Make it optional in schema
const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().optional(), // Now optional
});
```

#### Error: "bodySchema is not allowed for GET/DELETE methods"

**Problem:** Trying to use `bodySchema` with GET or DELETE requests.

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      bodySchema: UserSchema, // ❌ Error: bodySchema not allowed for GET
    },
  },
} as const);
```

**Solution:** Use `querySchema` for GET requests instead:

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      querySchema: UserFilterSchema, // ✅ Use querySchema for GET
      schema: z.array(UserSchema),
    },
  },
} as const);
```

#### Error: "Expected 1-2 arguments, but got 0"

**Problem:** Missing required parameters for query or mutation.

```typescript
// With path parameters
const { data } = api.users.get.useQuery(); // ❌ Error: Expected 1 argument
```

**Solution:** Provide the required parameters:

```typescript
// For path parameters
const { data } = api.users.get.useQuery({ id: "123" }); // ✅

// For query parameters
const { data } = api.users.list.useQuery({ page: 1 }); // ✅

// For no parameters (use undefined)
const { data } = api.users.list.useQuery(undefined, {
  staleTime: 5000,
}); // ✅
```

#### Error: "Type 'unknown' is not assignable to type X"

**Problem:** Response data is typed as `unknown` because no schema is provided.

```typescript
const { data } = api.users.list.useQuery();
const name: string = data[0].name; // ❌ Error: data is unknown
```

**Solution:** Add a schema to your endpoint configuration:

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      schema: z.array(UserSchema), // ✅ Add schema for type inference
    },
  },
} as const);

// Now data is properly typed
const { data } = api.users.list.useQuery();
const name: string = data?.[0].name; // ✅ Works!
```

#### Error: "Cannot find name 'z'"

**Problem:** Zod is not imported.

```typescript
const UserSchema = z.object({
  // ❌ Error: Cannot find name 'z'
  id: z.string(),
});
```

**Solution:** Import Zod at the top of your file:

```typescript
import { z } from "zod"; // ✅ Import Zod

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});
```

#### Error: "Type instantiation is excessively deep and possibly infinite"

**Problem:** TypeScript is having trouble inferring types, usually due to missing `as const`.

```typescript
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
}); // ❌ Missing 'as const'
```

**Solution:** Add `as const` to your configuration:

```typescript
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
} as const); // ✅ Add 'as const'
```

### Best Practices for Type Safety

1. **Always use `as const`** - This enables full type inference:

   ```typescript
   const api = createQueryAPI(config as const); // ✅
   ```

2. **Define schemas for all endpoints** - Get full type safety:

   ```typescript
   const api = createQueryAPI({
     users: {
       list: {
         method: "GET",
         path: "/users",
         querySchema: UserFilterSchema, // ✅ Query params typed
         schema: z.array(UserSchema), // ✅ Response typed
       },
       create: {
         method: "POST",
         path: "/users",
         bodySchema: CreateUserSchema, // ✅ Request body typed
         schema: UserSchema, // ✅ Response typed
       },
     },
   } as const);
   ```

3. **Use optional properties correctly** - Make properties optional in schema if they're not always required:

   ```typescript
   const UpdateUserSchema = z.object({
     name: z.string().optional(), // ✅ Optional for partial updates
     email: z.string().email().optional(),
   });
   ```

4. **Handle undefined data** - Always check for undefined before accessing properties:

   ```typescript
   const { data: user } = api.users.get.useQuery({ id: "123" });

   // ✅ Safe access
   if (user) {
     console.log(user.name);
   }

   // ✅ Optional chaining
   console.log(user?.name);

   // ❌ Unsafe - might be undefined
   console.log(user.name);
   ```

5. **Use TypeScript 5.0+** - For best type inference and error messages:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["ES2020", "DOM"],
       "strict": true
     }
   }
   ```

### Getting Help

If you encounter a type error that's not covered here:

1. Check that you're using TypeScript 5.0 or higher
2. Ensure `as const` is added to your configuration
3. Verify all schemas are properly defined
4. Check the [examples directory](./examples/) for working code
5. [Open an issue](https://github.com/kossidom/tanstack-api-generator/issues) with a minimal reproduction

## TypeScript

This library is built with TypeScript and provides complete type inference:

- Path parameters are extracted and typed automatically
- Response types are inferred from Zod schemas
- Request body types are enforced based on HTTP method
- All hooks have full TypeScript autocomplete

## Requirements

- React 18+
- TanStack Query v5+
- TypeScript 5.0+ (for best type inference)
- Zod 3+ (optional, for runtime validation)

## Documentation

- 📖 [Best Practices](./docs/BEST_PRACTICES.md) - Recommended patterns and usage guidelines
- 🔄 [Migration Guide](./docs/MIGRATION.md) - Migrate from manual TanStack Query setup
- 💡 [Full API Access](./examples/basic-usage/FULL_API_ACCESS.md) - Complete list of available properties
- 🎯 [Example Project](./examples/basic-usage/) - Full working example with all features

## Examples

Check out the [examples directory](./examples/) for complete working examples:

- **basic-usage** - Comprehensive example demonstrating all features
  - CRUD operations
  - Authentication with interceptors
  - Zod validation
  - Manual invalidation
  - Query key generation
  - All useQuery/useMutation properties

Run the example:

```bash
cd examples/basic-usage
npm install
npm run dev
```

## License

MIT © [Dominique Houessou](https://github.com/kossidom)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes in each version.

## Support

- 🐛 [Report a bug](https://github.com/kossidom/tanstack-api-generator/issues/new?labels=bug)
- 💡 [Request a feature](https://github.com/kossidom/tanstack-api-generator/issues/new?labels=enhancement)
- 💬 [Ask a question](https://github.com/kossidom/tanstack-api-generator/discussions)

## Acknowledgments

Built on top of the excellent [TanStack Query](https://tanstack.com/query) library by [Tanner Linsley](https://github.com/tannerlinsley).
