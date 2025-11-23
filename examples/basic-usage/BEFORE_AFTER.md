# Before/After Comparison: Type Safety Enhancement

This document shows the improvements made by adding `bodySchema` and `querySchema` to the API configuration.

## Before: Without bodySchema and querySchema

### API Configuration

```typescript
const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      schema: UserSchema, // Only response is typed
    },
  },
  posts: {
    list: {
      method: "GET",
      path: "/posts",
      schema: z.array(PostSchema), // Only response is typed
    },
  },
});
```

### Usage - Mutations (Before)

```typescript
const { mutate } = api.users.create.useMutation();

// ❌ Body is untyped (unknown)
// ❌ No autocompletion
// ❌ No compile-time errors for invalid data
mutate({
  body: {
    name: "John",
    email: "john@example.com",
    username: "john123",
    invalidField: "test", // ⚠️ No error - will be sent to API
  },
});

// ❌ No error for wrong types
mutate({
  body: {
    name: 123, // ⚠️ No error - wrong type accepted
    email: "invalid",
  },
});
```

### Usage - Queries (Before)

```typescript
// ❌ Query params are untyped
// ❌ No autocompletion
const { data } = api.posts.list.useQuery();

// Can't pass typed query parameters
// Would need manual URL construction or custom implementation
```

---

## After: With bodySchema and querySchema

### API Configuration

```typescript
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
});

const PostFilterSchema = z.object({
  userId: z.number().optional(),
  _limit: z.number().optional(),
});

const api = createQueryAPI({
  users: {
    create: {
      method: "POST",
      path: "/users",
      bodySchema: CreateUserSchema, // ✅ Request body is typed
      schema: UserSchema, // ✅ Response is typed
    },
  },
  posts: {
    list: {
      method: "GET",
      path: "/posts",
      querySchema: PostFilterSchema, // ✅ Query params are typed
      schema: z.array(PostSchema), // ✅ Response is typed
    },
  },
});
```

### Usage - Mutations (After)

```typescript
const { mutate } = api.users.create.useMutation();

// ✅ Body is fully typed
// ✅ Full IDE autocompletion
// ✅ Compile-time type checking
mutate({
  body: {
    name: "John", // ✅ Autocompleted
    email: "john@example.com", // ✅ Autocompleted
    username: "john123", // ✅ Autocompleted
  },
});

// ✅ TypeScript error for invalid fields
mutate({
  body: {
    name: "John",
    email: "john@example.com",
    username: "john123",
    invalidField: "test", // ❌ Error: Object literal may only specify known properties
  },
});

// ✅ TypeScript error for wrong types
mutate({
  body: {
    name: 123, // ❌ Error: Type 'number' is not assignable to type 'string'
    email: "invalid",
  },
});

// ✅ TypeScript error for missing required fields
mutate({
  body: {
    name: "John",
    // ❌ Error: Property 'email' is missing
  },
});
```

### Usage - Queries (After)

```typescript
// ✅ Query params are fully typed
// ✅ Full IDE autocompletion
// ✅ Compile-time type checking
const { data } = api.posts.list.useQuery({
  userId: 1, // ✅ Autocompleted, typed as number
  _limit: 10, // ✅ Autocompleted, typed as number
});

// ✅ TypeScript error for invalid params
const { data } = api.posts.list.useQuery({
  userId: 1,
  invalidParam: "test", // ❌ Error: Object literal may only specify known properties
});

// ✅ TypeScript error for wrong types
const { data } = api.posts.list.useQuery({
  userId: "1", // ❌ Error: Type 'string' is not assignable to type 'number'
});
```

---

## Benefits Summary

### ✅ Type Safety

- **Before**: Request bodies and query params were untyped (`unknown`)
- **After**: Full TypeScript types inferred from Zod schemas

### ✅ IDE Support

- **Before**: No autocompletion for request data
- **After**: Full autocompletion for all properties

### ✅ Error Detection

- **Before**: Errors only caught at runtime
- **After**: Errors caught at compile time

### ✅ Refactoring Safety

- **Before**: Schema changes could break code silently
- **After**: Schema changes cause TypeScript errors, ensuring updates

### ✅ Documentation

- **Before**: Developers need to check API docs for request structure
- **After**: Types serve as inline documentation

### ✅ Runtime Validation

- **Before**: No validation of request data
- **After**: Zod validates data before sending requests

---

## Migration Path

### Step 1: Add schemas for request bodies

```typescript
// Define schema for request body
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(1),
});

// Add to endpoint configuration
create: {
  method: "POST",
  path: "/users",
  bodySchema: CreateUserSchema,  // Add this line
  schema: UserSchema,
}
```

### Step 2: Add schemas for query parameters

```typescript
// Define schema for query params
const PostFilterSchema = z.object({
  userId: z.number().optional(),
  _limit: z.number().optional(),
});

// Add to endpoint configuration
list: {
  method: "GET",
  path: "/posts",
  querySchema: PostFilterSchema,  // Add this line
  schema: z.array(PostSchema),
}
```

### Step 3: Remove manual type casts

```typescript
// Before
mutate({ body: userData as CreateUser });

// After (no cast needed!)
mutate({ body: userData });
```

### Step 4: Update usage to pass query params

```typescript
// Before (couldn't pass query params easily)
const { data } = api.posts.list.useQuery();

// After (typed query params)
const { data } = api.posts.list.useQuery({
  userId: 1,
  _limit: 10,
});
```

---

## Backward Compatibility

The new features are **100% backward compatible**:

- Existing code without `bodySchema` continues to work
- Existing code without `querySchema` continues to work
- Body types default to `unknown` (same as before)
- No breaking changes to existing APIs

You can migrate incrementally, adding schemas to endpoints one at a time.
