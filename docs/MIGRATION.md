# Migration Guide

This guide helps you migrate from manual TanStack Query setup to @devtools/tanstack-api-generator.

## From Manual TanStack Query

### Before: Manual Setup

```typescript
// api/users.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Manual query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Manual fetcher functions
async function fetchUsers() {
  const response = await fetch("https://api.example.com/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

async function fetchUser(id: string) {
  const response = await fetch(`https://api.example.com/users/${id}`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}

async function createUser(data: { name: string; email: string }) {
  const response = await fetch("https://api.example.com/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json();
}

// Manual hooks
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Usage in components
function UserList() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();

  // ... component code
}
```

### After: With @devtools/tanstack-api-generator

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
      create: { method: "POST", path: "/users", schema: UserSchema },
    },
  } as const,
  {
    baseURL: "https://api.example.com",
  }
);

export type User = z.infer<typeof UserSchema>;

// Usage in components
function UserList() {
  const { data: users, isLoading } = api.users.list.useQuery();
  const createUser = api.users.create.useMutation();

  // ... component code
}
```

### Benefits

- ✅ **90% less code** - No manual hooks, keys, or fetchers
- ✅ **Automatic invalidation** - No manual cache management
- ✅ **Type safety** - Full TypeScript inference
- ✅ **Runtime validation** - Optional Zod schemas
- ✅ **Consistent patterns** - Same API for all endpoints

## From Other Libraries

### From React Query Builder

If you're using a query builder library:

**Before:**

```typescript
const queryBuilder = createQueryBuilder({
  baseUrl: "https://api.example.com",
});

const usersQuery = queryBuilder.query("users", "/users");
const userQuery = queryBuilder.query("user", "/users/:id");
```

**After:**

```typescript
const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
      get: { method: "GET", path: "/users/:id" },
    },
  } as const,
  { baseURL: "https://api.example.com" }
);
```

### From Custom Hooks

If you have custom hooks:

**Before:**

```typescript
function useUserData(userId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [userId]);

  return { data, loading };
}
```

**After:**

```typescript
const api = createQueryAPI({
  users: {
    get: { method: "GET", path: "/users/:id" },
  },
} as const);

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = api.users.get.useQuery({ id: userId });
  // Automatic caching, refetching, error handling, etc.
}
```

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
npm install @devtools/tanstack-api-generator @tanstack/react-query
npm install zod  # Optional, for validation
```

### Step 2: Create API Configuration

Create a new `api.ts` file:

```typescript
import { createQueryAPI } from "@tanstack-auto/query-api";

export const api = createQueryAPI(
  {
    // Start with one endpoint group
    users: {
      list: { method: "GET", path: "/users" },
    },
  } as const,
  {
    baseURL: process.env.REACT_APP_API_URL,
  }
);
```

### Step 3: Migrate One Endpoint at a Time

Replace manual hooks one at a time:

```typescript
// Before
const { data } = useUsers();

// After
const { data } = api.users.list.useQuery();
```

### Step 4: Add More Endpoints

Gradually add more endpoints to your configuration:

```typescript
export const api = createQueryAPI(
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
      // ... more endpoints
    },
  } as const,
  { baseURL: process.env.REACT_APP_API_URL }
);
```

### Step 5: Add Authentication

Move auth logic to interceptors:

```typescript
export const api = createQueryAPI(config, {
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
});
```

### Step 6: Add Validation (Optional)

Add Zod schemas for runtime validation:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const api = createQueryAPI(
  {
    users: {
      list: {
        method: "GET",
        path: "/users",
        schema: z.array(UserSchema), // Add schema
      },
    },
  } as const,
  { baseURL: process.env.REACT_APP_API_URL }
);
```

### Step 7: Remove Old Code

Once migrated, remove:

- Manual query key factories
- Manual fetcher functions
- Manual hooks
- Manual invalidation logic

## Common Patterns

### Pattern: Query with Filters

**Before:**

```typescript
function useUsers(filters: { role?: string }) {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: () => fetchUsers(filters),
  });
}
```

**After:**

```typescript
// Add query parameters to path
const api = createQueryAPI({
  users: {
    list: { method: "GET", path: "/users" },
  },
} as const);

// Pass as query options
const { data } = api.users.list.useQuery(undefined, {
  // Use TanStack Query's built-in features
});
```

### Pattern: Dependent Queries

**Before:**

```typescript
const { data: user } = useUser(userId);
const { data: posts } = usePosts(user?.id, { enabled: !!user });
```

**After:**

```typescript
const { data: user } = api.users.get.useQuery({ id: userId });
const { data: posts } = api.posts.byUser.useQuery(
  { userId: user?.id! },
  { enabled: !!user }
);
```

### Pattern: Optimistic Updates

**Before:**

```typescript
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ["users"] });
    const previous = queryClient.getQueryData(["users"]);
    queryClient.setQueryData(["users"], (old) => [...old, newUser]);
    return { previous };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(["users"], context.previous);
  },
});
```

**After:**

```typescript
const mutation = api.users.update.useMutation({
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: api.users.list.key() });
    const previous = queryClient.getQueryData(api.users.list.key());
    queryClient.setQueryData(api.users.list.key(), (old) => [
      ...old,
      variables.body,
    ]);
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(api.users.list.key(), context.previous);
  },
});
```

## Troubleshooting

### Issue: Type Inference Not Working

**Solution:** Make sure you're using `as const`:

```typescript
// ❌ Wrong
const api = createQueryAPI({ ... });

// ✅ Correct
const api = createQueryAPI({ ... } as const);
```

### Issue: Path Parameters Not Typed

**Solution:** Ensure path parameters use colon syntax:

```typescript
// ❌ Wrong
path: "/users/{id}";

// ✅ Correct
path: "/users/:id";
```

### Issue: Mutations Not Invalidating

**Solution:** Check that your endpoint groups match:

```typescript
// Mutations invalidate based on group name
const api = createQueryAPI({
  users: {  // Group name
    list: { ... },
    create: { ... },  // Will invalidate 'users' group
  },
} as const);
```

## Need Help?

- Check the [README](../README.md) for detailed documentation
- See [Best Practices](./BEST_PRACTICES.md) for usage patterns
- Open an issue on GitHub for specific questions

## Summary

Migration to @devtools/tanstack-api-generator typically:

- Reduces code by 80-90%
- Improves type safety
- Eliminates manual cache management
- Can be done incrementally
- Takes 1-2 hours for a typical app

Start with one endpoint group and gradually migrate the rest!
