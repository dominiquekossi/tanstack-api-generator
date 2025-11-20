# Full TanStack Query API Access

## ✅ Verification Complete

The `@tanstack-auto/query-api` library provides **complete access** to all TanStack Query properties and methods through the generated hooks.

## Implementation Details

### Type Definitions

The generated hooks use the official TanStack Query types:

```typescript
// From src/hooks/createHooks.ts

// useQuery returns complete UseQueryResult
export type UseQueryHook<TEndpoint extends EndpointConfig> = (
  params?,
  options?
) => UseQueryResult<InferResponse<TEndpoint>, Error>;

// useMutation returns complete UseMutationResult
export type UseMutationHook<TEndpoint extends EndpointConfig> = (
  options?
) => UseMutationResult<
  InferResponse<TEndpoint>,
  Error,
  MutationVariables<TEndpoint>
>;
```

### What This Means

Since we return the **complete** `UseQueryResult` and `UseMutationResult` types from `@tanstack/react-query`, users automatically get access to **ALL** properties and methods, including:

## useQuery Hook - All Available Properties

### Data & Status

- ✅ `data` - The query data
- ✅ `error` - Error object if query failed
- ✅ `status` - Query status: 'pending' | 'error' | 'success'
- ✅ `fetchStatus` - Fetch status: 'fetching' | 'paused' | 'idle'

### Boolean States

- ✅ `isLoading` - Initial loading state (pending + fetching)
- ✅ `isFetching` - Currently fetching data
- ✅ `isPending` - Query is in pending state
- ✅ `isError` - Query resulted in error
- ✅ `isSuccess` - Query was successful
- ✅ `isStale` - Data is stale and needs refetch
- ✅ `isRefetching` - Currently refetching
- ✅ `isPaused` - Query is paused
- ✅ `isPlaceholderData` - Currently showing placeholder data
- ✅ `isLoadingError` - Error occurred during initial load
- ✅ `isRefetchError` - Error occurred during refetch

### Methods

- ✅ `refetch()` - Manually trigger a refetch

### Metadata

- ✅ `dataUpdatedAt` - Timestamp of last successful data update
- ✅ `errorUpdatedAt` - Timestamp of last error
- ✅ `failureCount` - Number of consecutive failures
- ✅ `failureReason` - Reason for the failure

## useMutation Hook - All Available Properties

### Methods

- ✅ `mutate()` - Trigger the mutation (fire and forget)
- ✅ `mutateAsync()` - Trigger the mutation (returns promise)
- ✅ `reset()` - Reset mutation state to idle

### Data & Status

- ✅ `data` - The mutation result data
- ✅ `error` - Error object if mutation failed
- ✅ `status` - Mutation status: 'idle' | 'pending' | 'error' | 'success'
- ✅ `variables` - Variables passed to the last mutation call

### Boolean States

- ✅ `isPending` - Mutation is currently executing
- ✅ `isIdle` - Mutation hasn't been triggered yet
- ✅ `isSuccess` - Mutation was successful
- ✅ `isError` - Mutation resulted in error

### Metadata

- ✅ `failureCount` - Number of consecutive failures
- ✅ `failureReason` - Reason for the failure
- ✅ `submittedAt` - Timestamp when mutation was submitted

## Live Example

See `src/components/AdvancedQueryFeatures.tsx` for a working demonstration that destructures and displays all these properties in action.

## Usage Examples

### Using All Query Properties

```typescript
const {
  data,
  error,
  isLoading,
  isFetching,
  isError,
  isSuccess,
  isPending,
  status,
  fetchStatus,
  refetch,
  isStale,
  isRefetching,
  failureCount,
  dataUpdatedAt,
} = api.users.list.useQuery();

// All properties are fully typed and available!
if (isLoading) return <div>Loading...</div>;
if (isError) return <div>Error: {error.message}</div>;
if (isFetching) console.log("Fetching in background...");

// Manual refetch
<button onClick={() => refetch()}>Refresh</button>;
```

### Using All Mutation Properties

```typescript
const {
  mutate,
  mutateAsync,
  data,
  error,
  isPending,
  isIdle,
  isSuccess,
  isError,
  reset,
  variables,
  failureCount,
} = api.users.create.useMutation({
  onSuccess: (data) => {
    console.log("Created:", data);
  },
});

// All properties are fully typed and available!
<button onClick={() => mutate({ body: { name: "John" } })} disabled={isPending}>
  {isPending ? "Creating..." : "Create User"}
</button>;

{
  isSuccess && <div>Success! Created user with ID: {data.id}</div>;
}
{
  isError && <div>Error: {error.message}</div>;
}

<button onClick={() => reset()}>Reset</button>;
```

## Conclusion

✅ **No limitations** - All TanStack Query functionality is available  
✅ **Fully typed** - TypeScript provides autocomplete for all properties  
✅ **Zero overhead** - Direct passthrough to TanStack Query types  
✅ **Future-proof** - Automatically includes any new properties added to TanStack Query

The library doesn't restrict or filter any properties - it's a thin wrapper that generates hooks while preserving the complete TanStack Query API surface.
