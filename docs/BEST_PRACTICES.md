# Best Practices

This guide covers best practices for using @devtools/tanstack-api-generator effectively in your applications.

## Configuration

### Use `as const` for Type Inference

Always use `as const` assertion on your configuration object to enable full type inference:

```typescript
// ✅ Good - Full type inference
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
} as const);

// ❌ Bad - No type inference
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
});
```

### Organize Endpoints by Resource

Group related endpoints together for better organization:

```typescript
// ✅ Good - Organized by resource
const api = createQueryAPI({
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
} as const);
```

### Separate API Configuration

Keep your API configuration in a separate file:

```typescript
// api.ts
import { createQueryAPI } from "@devtools/tanstack-api-generator";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users", schema: z.array(UserSchema) },
      get: { method: "GET", path: "/users/:id", schema: UserSchema },
    },
  } as const,
  {
    baseURL: process.env.REACT_APP_API_URL,
    beforeRequest: async (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  }
);

export type User = z.infer<typeof UserSchema>;
```

## Authentication

### Use beforeRequest for Auth

Implement authentication in the `beforeRequest` interceptor:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  beforeRequest: async (config) => {
    // Get token from your auth provider
    const token = await getAuthToken();

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

### Handle Auth Errors Globally

Use `afterResponse` to handle authentication errors:

```typescript
const api = createQueryAPI(config, {
  baseURL: "https://api.example.com",
  afterResponse: async (response) => {
    if (response.status === 401) {
      // Clear auth state
      localStorage.removeItem("authToken");
      // Redirect to login
      window.location.href = "/login";
    }
    return response;
  },
});
```

## Error Handling

### Handle Errors at Component Level

Handle specific errors in your components:

```typescript
function UserList() {
  const { data, error, isError } = api.users.list.useQuery();

  if (isError) {
    return (
      <div className="error">
        <h3>Failed to load users</h3>
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Use Error Boundaries

Wrap your app in an error boundary for unexpected errors:

```typescript
import { ErrorBoundary } from "react-error-boundary";

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong. Please refresh the page.</div>}
      onError={(error) => {
        console.error("App error:", error);
        // Log to error tracking service
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Query Management

### Use Conditional Queries

Only fetch data when needed:

```typescript
function UserProfile({ userId }: { userId: string | null }) {
  const { data: user } = api.users.get.useQuery(
    { id: userId! },
    {
      enabled: !!userId, // Only fetch when userId exists
    }
  );

  return user ? <div>{user.name}</div> : <div>Select a user</div>;
}
```

### Configure Stale Time

Set appropriate stale times based on data freshness requirements:

```typescript
// Data that changes frequently
const { data: liveData } = api.stats.current.useQuery(undefined, {
  staleTime: 0, // Always refetch
  refetchInterval: 5000, // Poll every 5 seconds
});

// Data that rarely changes
const { data: staticData } = api.config.get.useQuery(undefined, {
  staleTime: Infinity, // Never mark as stale
});

// Data with moderate freshness requirements
const { data: users } = api.users.list.useQuery(undefined, {
  staleTime: 60000, // 1 minute
});
```

### Prefetch Data

Prefetch data for better UX:

```typescript
import { useQueryClient } from "@tanstack/react-query";

function UserListItem({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: api.users.get.key({ id: userId }),
      queryFn: () => api.users.get.useQuery({ id: userId }),
    });
  };

  return (
    <li onMouseEnter={prefetchUser}>
      <Link to={`/users/${userId}`}>View User</Link>
    </li>
  );
}
```

## Mutations

### Use Optimistic Updates

Provide instant feedback with optimistic updates:

```typescript
function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const toggleTodo = api.todos.update.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: api.todos.list.key() });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(api.todos.list.key());

      // Optimistically update
      queryClient.setQueryData(api.todos.list.key(), (old: Todo[]) =>
        old.map((t) =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );

      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(api.todos.list.key(), context?.previousTodos);
    },
  });

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() =>
          toggleTodo.mutate({
            params: { id: todo.id },
            body: { completed: !todo.completed },
          })
        }
      />
      {todo.title}
    </div>
  );
}
```

### Handle Mutation Errors

Provide clear feedback for mutation errors:

```typescript
function CreateUserForm() {
  const [error, setError] = useState<string | null>(null);

  const createUser = api.users.create.useMutation({
    onSuccess: () => {
      setError(null);
      // Show success message
      toast.success("User created successfully!");
    },
    onError: (error) => {
      setError(error.message);
      // Log error for debugging
      console.error("Failed to create user:", error);
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

## Performance

### Avoid Unnecessary Refetches

Configure refetch behavior appropriately:

```typescript
const { data } = api.users.list.useQuery(undefined, {
  refetchOnWindowFocus: false, // Don't refetch on window focus
  refetchOnMount: false, // Don't refetch on component mount
  refetchOnReconnect: false, // Don't refetch on reconnect
});
```

### Use Pagination

Implement pagination for large datasets:

```typescript
function UserList() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = api.users.list.useQuery(
    { page, limit: 20 },
    {
      keepPreviousData: true, // Keep previous data while fetching
    }
  );

  return (
    <div>
      <ul>
        {data?.items.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage((p) => p + 1)} disabled={!data?.hasMore}>
        Next
      </button>
    </div>
  );
}
```

### Debounce Search Queries

Debounce search inputs to reduce API calls:

```typescript
import { useDebouncedValue } from "./hooks/useDebouncedValue";

function UserSearch() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: users } = api.users.search.useQuery(
    { q: debouncedSearch },
    {
      enabled: debouncedSearch.length > 2, // Only search with 3+ characters
    }
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
      />
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing

### Mock API Responses

Use MSW (Mock Service Worker) for testing:

```typescript
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("https://api.example.com/users", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: "1", name: "John Doe", email: "john@example.com" },
        { id: "2", name: "Jane Doe", email: "jane@example.com" },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders user list", async () => {
  render(<UserList />);

  expect(await screen.findByText("John Doe")).toBeInTheDocument();
  expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
});
```

### Test Loading and Error States

Test all component states:

```typescript
test("shows loading state", () => {
  render(<UserList />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("shows error state", async () => {
  server.use(
    rest.get("https://api.example.com/users", (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(<UserList />);

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

## TypeScript

### Export Inferred Types

Export types for use throughout your app:

```typescript
// api.ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users", schema: z.array(UserSchema) },
  },
} as const);

// Export inferred types
export type User = z.infer<typeof UserSchema>;
```

### Use Type Guards

Create type guards for runtime type checking:

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value
  );
}
```

## Summary

- ✅ Always use `as const` for type inference
- ✅ Organize endpoints by resource
- ✅ Implement auth in `beforeRequest`
- ✅ Handle errors at component level
- ✅ Use conditional queries when appropriate
- ✅ Configure stale times based on data freshness
- ✅ Implement optimistic updates for better UX
- ✅ Debounce search queries
- ✅ Test all component states
- ✅ Export and reuse inferred types
