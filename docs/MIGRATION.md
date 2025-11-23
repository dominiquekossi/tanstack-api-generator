# Migration Guide

This guide helps you migrate from manual TanStack Query setup to tanstack-api-generator.

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

### After: With tanstack-api-generator

```typescript
// api.ts
import { createQueryAPI } from "tanstack-api-generator";
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
npm install tanstack-api-generator @tanstack/react-query
npm install zod  # Optional, for validation
```

### Step 2: Create API Configuration

Create a new `api.ts` file:

```typescript
import { createQueryAPI } from "tanstack-api-generator";

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

## Migrating to bodySchema and querySchema (Type Safety Enhancement)

If you're already using tanstack-api-generator, you can enhance your type safety by adding `bodySchema` and `querySchema` to your endpoints.

### Why Migrate?

- ✅ **Full type safety** for request bodies and query parameters
- ✅ **IDE autocompletion** for all request data
- ✅ **Compile-time errors** for invalid data
- ✅ **Runtime validation** with Zod schemas
- ✅ **100% backward compatible** - migrate incrementally

### Step 1: Define Request Schemas

Create Zod schemas for your request bodies and query parameters:

```typescript
import { z } from "zod";

// Request body schemas
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

// Query parameter schemas
const UserFilterSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["admin", "user", "guest"]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});
```

### Step 2: Add bodySchema to POST/PUT/PATCH Endpoints

**Before:**

```typescript
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      schema: UserSchema, // Only response is typed
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      schema: UserSchema, // Only response is typed
    },
  },
} as const);

// Usage - body is untyped (unknown)
createUser.mutate({
  body: {
    name: "John",
    email: "john@example.com",
    invalidField: "test", // ⚠️ No error!
  },
});
```

**After:**

```typescript
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // ✅ Request body is typed
      schema: UserSchema, // ✅ Response is typed
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      bodySchema: UpdateUserSchema, // ✅ Request body is typed
      schema: UserSchema, // ✅ Response is typed
    },
  },
} as const);

// Usage - body is fully typed
createUser.mutate({
  body: {
    name: "John", // ✅ Autocompleted
    email: "john@example.com", // ✅ Autocompleted
    age: 30, // ✅ Autocompleted
    // invalidField: "test",  // ❌ TypeScript error!
  },
});
```

### Step 3: Add querySchema to GET Endpoints

**Before:**

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      schema: z.array(UserSchema), // Only response is typed
    },
  },
} as const);

// Can't pass typed query parameters
const { data } = api.users.list.useQuery();
```

**After:**

```typescript
const api = createQueryAPI({
  users: {
    list: {
      method: "GET",
      path: "/users",
      querySchema: UserFilterSchema, // ✅ Query params are typed
      schema: z.array(UserSchema), // ✅ Response is typed
    },
  },
} as const);

// Query params are fully typed
const { data } = api.users.list.useQuery({
  name: "John", // ✅ Autocompleted
  role: "admin", // ✅ Autocompleted, enum validated
  page: 1, // ✅ Autocompleted
  limit: 10, // ✅ Autocompleted
  // invalid: true,  // ❌ TypeScript error!
});
```

### Step 4: Update Component Usage

**Before:**

```typescript
function CreateUser() {
  const createUser = api.users.create.useMutation();

  const handleSubmit = (data: any) => {
    // Manual type casting needed
    createUser.mutate({
      body: data as CreateUser,
    });
  };
}
```

**After:**

```typescript
function CreateUser() {
  const createUser = api.users.create.useMutation();

  const handleSubmit = (data: CreateUser) => {
    // No casting needed - fully typed!
    createUser.mutate({
      body: data, // ✅ Type-safe
    });
  };
}
```

### Step 5: Handle Path Params + Body/Query

For endpoints with both path parameters and body/query:

**Mutations with path params and body:**

```typescript
// Endpoint configuration
update: {
  method: "PUT",
  path: "/users/:id",
  bodySchema: UpdateUserSchema,
  schema: UserSchema,
}

// Usage
updateUser.mutate({
  params: { id: "123" },  // ✅ Typed from path
  body: {                 // ✅ Typed from bodySchema
    name: "Jane",
    email: "jane@example.com",
  },
});
```

**Queries with path params and query:**

```typescript
// Endpoint configuration
byUser: {
  method: "GET",
  path: "/users/:userId/posts",
  querySchema: PostFilterSchema,
  schema: z.array(PostSchema),
}

// Usage
const { data } = api.posts.byUser.useQuery(
  { userId: "123" },        // ✅ Typed from path
  { status: "published" }   // ✅ Typed from querySchema
);
```

### Migration Checklist

- [ ] Install Zod if not already installed: `npm install zod`
- [ ] Define schemas for request bodies (POST/PUT/PATCH)
- [ ] Define schemas for query parameters (GET with filters)
- [ ] Add `bodySchema` to POST/PUT/PATCH endpoints
- [ ] Add `querySchema` to GET endpoints with filters
- [ ] Update component usage to remove type casts
- [ ] Test TypeScript compilation for errors
- [ ] Verify runtime validation works as expected

### Common Scenarios

#### Scenario 1: Optional Fields

```typescript
const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// All fields are optional
updateUser.mutate({
  params: { id: "123" },
  body: { name: "New Name" }, // ✅ Email is optional
});
```

#### Scenario 2: Default Values

```typescript
const CreatePostSchema = z.object({
  title: z.string(),
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z.array(z.string()).default([]),
});

// Defaults are applied
createPost.mutate({
  body: { title: "My Post" }, // ✅ status and tags use defaults
});
```

#### Scenario 3: Nested Objects

```typescript
const CreateUserSchema = z.object({
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string(),
  }),
});

// Nested objects are fully typed
createUser.mutate({
  body: {
    name: "John",
    address: {
      street: "123 Main St", // ✅ Autocompleted
      city: "New York", // ✅ Autocompleted
      zipCode: "10001", // ✅ Autocompleted
    },
  },
});
```

#### Scenario 4: Arrays

```typescript
const CreatePostSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
});

// Arrays are fully typed
createPost.mutate({
  body: {
    title: "My Post",
    tags: ["typescript", "react"], // ✅ string[] typed
  },
});
```

### Backward Compatibility

The new features are **100% backward compatible**:

```typescript
// Old code without bodySchema/querySchema still works
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      schema: UserSchema, // ✅ Still works, body is 'unknown'
    },
  },
} as const);

// You can migrate endpoints one at a time
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // ✅ New: typed body
      schema: UserSchema,
    },
    update: {
      method: "PUT",
      path: "/users/:id",
      schema: UserSchema, // ✅ Old: untyped body (still works)
    },
  },
} as const);
```

### Benefits Summary

| Feature             | Before        | After                   |
| ------------------- | ------------- | ----------------------- |
| Request body typing | `unknown`     | Fully typed from schema |
| Query param typing  | Not supported | Fully typed from schema |
| IDE autocompletion  | ❌ No         | ✅ Yes                  |
| Compile-time errors | ❌ No         | ✅ Yes                  |
| Runtime validation  | ❌ No         | ✅ Yes                  |
| Type casting needed | ✅ Yes        | ❌ No                   |

### Examples

See the following examples for complete implementations:

- **Comprehensive Example**: `examples/typed-api/` - Full demonstration of all features
- **Basic Example**: `examples/basic-usage/` - Updated with bodySchema and querySchema
- **Before/After Comparison**: `examples/basic-usage/BEFORE_AFTER.md`

## Need Help?

- Check the [README](../README.md) for detailed documentation
- See [Best Practices](./BEST_PRACTICES.md) for usage patterns
- Open an issue on GitHub for specific questions

## Summary

Migration to tanstack-api-generator typically:

- Reduces code by 80-90%
- Improves type safety
- Eliminates manual cache management
- Can be done incrementally
- Takes 1-2 hours for a typical app

Start with one endpoint group and gradually migrate the rest!
