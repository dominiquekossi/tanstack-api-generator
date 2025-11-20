# Release Notes - v1.0.0

## 🎉 First Stable Release

We're excited to announce the first stable release of **@devtools/tanstack-api-generator** - a zero-boilerplate code generation library for TanStack Query v5+!

## 📦 Installation

```bash
npm install @devtools/tanstack-api-generator @tanstack/react-query
```

## ✨ What's Included

### Core Features

- ✅ **Automatic Hook Generation** - Define your API once, get fully-typed hooks automatically
- ✅ **Type-Safe Path Parameters** - Parameters extracted from URL paths and fully typed
- ✅ **Complete CRUD Operations** - Full support for GET, POST, PUT, PATCH, DELETE
- ✅ **Smart Query Keys** - Deterministic, hierarchical keys following TanStack Query v5 standards
- ✅ **Automatic Invalidation** - Mutations automatically refresh related queries
- ✅ **Manual Invalidation** - Programmatic cache control when you need it

### Advanced Features

- ✅ **Request/Response Interceptors** - Add authentication, logging, or custom headers
- ✅ **Zod Validation** - Optional runtime type safety with Zod schemas
- ✅ **Full TypeScript Inference** - Complete type safety from config to hooks
- ✅ **Query Key Generation** - Access generated keys for custom cache operations
- ✅ **Full TanStack Query API** - All useQuery/useMutation properties available

### Developer Experience

- ✅ **Zero Configuration** - Works out of the box with minimal setup
- ✅ **Tiny Bundle** - Minimal runtime overhead beyond TanStack Query
- ✅ **Comprehensive Documentation** - Detailed guides and examples
- ✅ **Full Working Example** - Complete example project included

## 🚀 Quick Start

```typescript
import { createQueryAPI } from "@devtools/tanstack-api-generator";

const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
      get: { method: "GET", path: "/users/:id" },
      create: { method: "POST", path: "/users" },
    },
  } as const,
  { baseURL: "https://api.example.com" }
);

// Use generated hooks
function UserList() {
  const { data: users } = api.users.list.useQuery();
  return (
    <ul>
      {users?.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

## 📚 Documentation

- [README](./README.md) - Complete documentation with examples
- [Best Practices](./docs/BEST_PRACTICES.md) - Recommended patterns
- [Migration Guide](./docs/MIGRATION.md) - Migrate from manual setup
- [Full API Access](./examples/basic-usage/FULL_API_ACCESS.md) - All available properties
- [Example Project](./examples/basic-usage/) - Full working example

## 🎯 Why Use This Library?

### Before (Manual TanStack Query)

```typescript
// Manual query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Manual fetcher
async function fetchUsers() {
  const response = await fetch("https://api.example.com/users");
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
}

// Manual hook
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUsers,
  });
}

// Manual invalidation
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

### After (With @devtools/tanstack-api-generator)

```typescript
const api = createQueryAPI(
  {
    users: {
      list: { method: "GET", path: "/users" },
      create: { method: "POST", path: "/users" },
    },
  } as const,
  { baseURL: "https://api.example.com" }
);

// That's it! Use the hooks:
const { data } = api.users.list.useQuery();
const createUser = api.users.create.useMutation();
// Automatic invalidation included!
```

**Result:** 90% less code, full type safety, automatic cache management!

## 🔧 Technical Details

- Built with TypeScript 5.3+
- Compatible with React 18+
- Compatible with TanStack Query v5+
- Optional Zod 3+ support
- Zero runtime dependencies (peer dependencies only)
- Tree-shakeable
- ESM support

## 📊 Bundle Size

- **Package size:** 21.3 kB
- **Unpacked size:** 87.4 kB
- **Minimal runtime overhead** beyond TanStack Query

## 🙏 Acknowledgments

Built on top of the excellent [TanStack Query](https://tanstack.com/query) library by [Tanner Linsley](https://github.com/tannerlinsley).

## 🐛 Found a Bug?

Please [open an issue](https://github.com/kossidom/tanstack-api-generator/issues/new?labels=bug) on GitHub.

## 💡 Have a Feature Request?

We'd love to hear your ideas! [Open a feature request](https://github.com/kossidom/tanstack-api-generator/issues/new?labels=enhancement).

## 📝 License

MIT © [Dominique Houessou](https://github.com/kossidom)

---

**Ready to eliminate boilerplate?** Install now:

```bash
npm install @devtools/tanstack-api-generator @tanstack/react-query
```

Check out the [full documentation](./README.md) to get started!
