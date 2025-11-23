import { useState } from "react";
import { api } from "../api";

/**
 * This component demonstrates typed queries with querySchema.
 *
 * Key features:
 * - Full TypeScript autocompletion for query parameters
 * - Compile-time type checking for filters
 * - Type-safe response data
 * - Proper query key generation with params
 */
export function TypedQueries() {
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | "guest" | "">(
    ""
  );
  const [minAge, setMinAge] = useState("");
  const [page, setPage] = useState(1);

  // ============================================================================
  // EXAMPLE 1: Query with typed query parameters
  // ============================================================================

  const {
    data: users,
    isLoading,
    error,
  } = api.users.list.useQuery({
    // ✅ All query params are typed and autocompleted
    name: nameFilter || undefined,
    role: roleFilter || undefined,
    minAge: minAge ? Number(minAge) : undefined,
    page,
    limit: 10,
  });

  // ❌ This would cause a TypeScript error:
  // const { data } = api.users.list.useQuery({
  //   name: "John",
  //   invalidParam: "test",  // Error: Object literal may only specify known properties
  // });

  // ❌ This would cause a TypeScript error:
  // const { data } = api.users.list.useQuery({
  //   page: "1",  // Error: Type 'string' is not assignable to type 'number'
  // });

  // ============================================================================
  // EXAMPLE 2: Query with path params AND query params
  // ============================================================================

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [postStatus, setPostStatus] = useState<
    "draft" | "published" | "archived" | ""
  >("");

  const { data: userPosts } = api.posts.byUser.useQuery(
    { userId: selectedUserId || "1" }, // ✅ Path params - typed from path template
    {
      // ✅ Query params - typed from querySchema
      status: postStatus || undefined,
      limit: 5,
    }
  );

  // ❌ This would cause a TypeScript error:
  // const { data } = api.posts.byUser.useQuery(
  //   { userId: "123" },
  //   { status: "invalid" }  // Error: Type '"invalid"' is not assignable to type '"draft" | "published" | "archived"'
  // );

  // ============================================================================
  // EXAMPLE 3: Simple query without params (just options)
  // ============================================================================

  const { data: _allPosts } = api.posts.list.useQuery(
    {
      // ✅ Query params are optional
      limit: 20,
    },
    {
      // ✅ TanStack Query options
      staleTime: 5000,
      refetchOnWindowFocus: false,
    }
  );

  // ============================================================================
  // EXAMPLE 4: Query with path params only (no query params)
  // ============================================================================

  const { data: _singleUser } = api.users.get.useQuery(
    { id: "123" }, // ✅ Only path params needed
    {
      // ✅ TanStack Query options
      enabled: !!selectedUserId,
    }
  );

  // ============================================================================
  // Response data is fully typed
  // ============================================================================

  const renderUsers = () => {
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
      <div className="user-list">
        {users?.map((user: any) => (
          <div key={user.id} className="user-card">
            {/* ✅ All properties are autocompleted */}
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p>Age: {user.age}</p>
            <p>Role: {user.role}</p>
            <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>

            {/* ❌ This would cause a TypeScript error: */}
            {/* <p>{user.invalidField}</p>  // Error: Property 'invalidField' does not exist */}

            <button onClick={() => setSelectedUserId(user.id)}>
              View Posts
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="typed-queries">
      <h2>Typed Queries Demo</h2>

      <div className="filters">
        <h3>Filter Users</h3>
        <div className="filter-group">
          <input
            type="text"
            placeholder="Filter by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="guest">Guest</option>
          </select>

          <input
            type="number"
            placeholder="Min age"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
          />

          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      <div className="results">{renderUsers()}</div>

      {selectedUserId && (
        <div className="user-posts">
          <h3>Posts by User {selectedUserId}</h3>

          <div className="filter-group">
            <select
              value={postStatus}
              onChange={(e) => setPostStatus(e.target.value as any)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="post-list">
            {userPosts?.map((post: any) => (
              <div key={post.id} className="post-card">
                {/* ✅ All properties are autocompleted */}
                <h4>{post.title}</h4>
                <p>{post.content}</p>
                <p>Status: {post.status}</p>
                <p>Tags: {post.tags.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-box">
        <h4>💡 Query Parameter Type Safety</h4>
        <ul>
          <li>✅ Query params are fully typed from querySchema</li>
          <li>✅ IDE autocompletion for all filter options</li>
          <li>✅ Compile-time errors for invalid params</li>
          <li>✅ Query keys automatically include params for proper caching</li>
          <li>✅ Works seamlessly with path params</li>
        </ul>
      </div>
    </div>
  );
}
