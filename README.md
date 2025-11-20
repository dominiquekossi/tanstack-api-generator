# @tanstack-auto/query-api

Automatic code generation library for TanStack Query v5+ that eliminates manual boilerplate. Generate fully-typed React Query hooks, query keys, fetchers, and invalidation helpers from a simple typed configuration object.

## Features

- 🎯 **Zero Boilerplate** - Define your API once, get fully-typed hooks automatically
- 🔒 **Type-Safe** - Complete TypeScript inference from configuration to hooks
- 🔑 **Smart Query Keys** - Deterministic, hierarchical keys following TanStack Query v5 standards
- ♻️ **Auto Invalidation** - Mutations automatically invalidate related queries
- 🎣 **Flexible Interceptors** - Add authentication, logging, or custom headers easily
- ✅ **Optional Validation** - Runtime type safety with Zod schemas
- 📦 **Tiny Bundle** - Minimal runtime overhead beyond TanStack Query itself

## Installation

```bash
npm install @tanstack-auto/query-api @tanstack/react-query
# or
yarn add @tanstack-auto/query-api @tanstack/react-query
# or
pnpm add @tanstack-auto/query-api @tanstack/react-query
```

Optional: Install Zod for runtime validation

```bash
npm install zod
```

## Quick Start

### 1. Define Your API Configuration

```typescript
import { createQueryAPI } from "@tanstack-auto/query-api";

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

### Runtime Validation with Zod

Add Zod schemas for runtime type safety and automatic validation:

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

**Benefits of Zod validation:**

- Runtime type safety - catch API contract violations
- Automatic type inference - no need to manually type responses
- Data transformation - Zod can coerce and transform data
- Validation errors - get detailed error messages when validation fails

**Validation is optional:**

```typescript
// Without schema - data is typed as `unknown`
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
} as const);

// You can still use it, just without runtime validation
const { data } = api.users.list.useQuery();
// data is `unknown` - you'll need to type it yourself
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
  schema?: z.ZodSchema;
};
```

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

- 🐛 [Report a bug](https://github.com/kossidom/tanstack-auto-query-api/issues/new?labels=bug)
- 💡 [Request a feature](https://github.com/kossidom/tanstack-auto-query-api/issues/new?labels=enhancement)
- 💬 [Ask a question](https://github.com/kossidom/tanstack-auto-query-api/discussions)

## Acknowledgments

Built on top of the excellent [TanStack Query](https://tanstack.com/query) library by [Tanner Linsley](https://github.com/tannerlinsley).
