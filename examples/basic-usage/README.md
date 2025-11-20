# tanstack-api-generator Example

This example demonstrates **all major features** of `tanstack-api-generator` with a comprehensive React application.

## Features Demonstrated

### Core Features

- ✅ **Automatic Hook Generation** - GET requests become `useQuery`, mutations become `useMutation`
- ✅ **Type-Safe Path Parameters** - Parameters extracted from URL paths and fully typed
- ✅ **Complete CRUD Operations** - Create (POST), Read (GET), Update (PUT), Delete (DELETE)
- ✅ **Zod Schema Validation** - Runtime type safety with automatic response validation
- ✅ **Interceptors** - `beforeRequest` and `afterResponse` hooks for logging and auth
- ✅ **Automatic Invalidation** - Mutations automatically refresh related queries
- ✅ **Query Keys** - Deterministic, hierarchical keys following TanStack Query v5 standards

### Advanced Features

- ✅ **Manual Invalidation** - Programmatic cache invalidation with `invalidate` utilities
- ✅ **Query Key Generation** - Access generated keys for custom cache operations
- ✅ **Nested Endpoint Groups** - Organize endpoints by resource type
- ✅ **TypeScript Inference** - Full type safety from config to hooks
- ✅ **Error Handling** - Structured error handling with proper typing
- ✅ **Full TanStack Query API** - All properties and methods from `useQuery` and `useMutation` are available

### 🎯 Important: Complete TanStack Query API Access

The generated hooks return **complete** `UseQueryResult` and `UseMutationResult` types. You have access to **ALL** properties and methods:

**useQuery provides:**

- `data`, `error`, `status`, `fetchStatus`
- `isLoading`, `isFetching`, `isPending`, `isError`, `isSuccess`
- `isStale`, `isRefetching`, `isPaused`, `isPlaceholderData`
- `refetch()`, `dataUpdatedAt`, `errorUpdatedAt`, `failureCount`, and more

**useMutation provides:**

- `mutate()`, `mutateAsync()`, `data`, `error`, `status`
- `isPending`, `isIdle`, `isSuccess`, `isError`
- `reset()`, `variables`, `failureCount`, `submittedAt`, and more

See the **AdvancedQueryFeatures** component for a live demonstration!

## Running the Example

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── api.ts                          # API configuration with createQueryAPI
├── main.tsx                        # App entry point with QueryClientProvider
├── App.tsx                         # Main app component with navigation
├── components/
│   ├── UserList.tsx               # Demonstrates useQuery for lists
│   ├── UserDetail.tsx             # Demonstrates UPDATE & DELETE mutations
│   ├── CreateUser.tsx             # Demonstrates CREATE mutation (POST)
│   ├── PostList.tsx               # Demonstrates multiple endpoint groups
│   ├── AdvancedQueryFeatures.tsx  # All useQuery/useMutation properties
│   └── QueryKeyDemo.tsx           # Manual invalidation & query keys
└── index.css                      # Styles
```

## Component Features

### UserList.tsx

- GET request with `useQuery`
- Loading and error states
- List rendering with type safety

### UserDetail.tsx

- GET with path parameters
- UPDATE mutation (PUT)
- DELETE mutation
- Automatic invalidation on mutations
- Related data fetching (posts by user)

### CreateUser.tsx

- POST mutation with `useMutation`
- Form handling
- Success/error callbacks
- Automatic list invalidation

### PostList.tsx

- Multiple endpoint groups
- Demonstrates nested API structure

### AdvancedQueryFeatures.tsx

- **All useQuery properties**: data, isLoading, isFetching, isPending, isError, isSuccess, status, fetchStatus, refetch, isStale, isRefetching, isPaused, failureCount, etc.
- **All useMutation properties**: mutate, mutateAsync, isPending, isIdle, isSuccess, isError, reset, variables, failureCount, etc.
- Live demonstration of query states
- Interactive examples of all methods

### QueryKeyDemo.tsx

- Query key generation and inspection
- Manual invalidation utilities
- Cache inspection
- Hierarchical key structure

## Key Code Examples

### API Configuration (src/api.ts)

```typescript
export const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users", schema: z.array(UserSchema) },
      get: { method: "GET", path: "/users/:id", schema: UserSchema },
      create: { method: "POST", path: "/users", schema: UserSchema },
    },
  } as const,
  {
    baseURL: "https://jsonplaceholder.typicode.com",
    beforeRequest: async (config) => {
      console.log("Making request:", config);
      return config;
    },
  }
);
```

### Using Generated Hooks

```typescript
// Query with no parameters
const { data: users } = api.users.list.useQuery();

// Query with path parameters (fully typed!)
const { data: user } = api.users.get.useQuery({ id: userId });

// CREATE mutation with automatic invalidation
const createUser = api.users.create.useMutation({
  onSuccess: (data) => {
    console.log("User created:", data);
    // List query is automatically invalidated
  },
});
createUser.mutate({ body: { name, email, username } });

// UPDATE mutation with path params and body
const updateUser = api.users.update.useMutation();
updateUser.mutate({
  params: { id: userId },
  body: { name, email, username },
});

// DELETE mutation
const deleteUser = api.users.delete.useMutation();
deleteUser.mutate({ params: { id: userId } });

// Manual invalidation
await api.users.invalidate.list(); // Invalidate user list
await api.users.invalidate.get({ id: 1 }); // Invalidate specific user
await api.users.invalidate.all(); // Invalidate all user queries

// Query key access
const userListKey = api.users.list.key();
const userDetailKey = api.users.get.key({ id: 1 });
```

## API Used

This example uses [JSONPlaceholder](https://jsonplaceholder.typicode.com/), a free fake REST API for testing and prototyping.

## Learn More

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)
- [tanstack-api-generator README](../../README.md)
