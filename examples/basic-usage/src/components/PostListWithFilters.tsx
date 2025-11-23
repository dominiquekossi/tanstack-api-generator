import { useState } from "react";
import { api, type Post } from "../api";

/**
 * This component demonstrates the new querySchema feature.
 * Query parameters are now fully typed with autocompletion.
 */
export function PostListWithFilters() {
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState<number>(10);

  // ✅ NEW: Query parameters are fully typed from querySchema
  const {
    data: posts,
    isLoading,
    error,
  } = api.posts.list.useQuery({
    userId, // ✅ Typed as number | undefined
    _limit: limit, // ✅ Typed as number | undefined
  });

  // Example of what would cause TypeScript errors:
  // const { data } = api.posts.list.useQuery({
  //   userId: "1",  // ❌ Error: Type 'string' is not assignable to type 'number'
  //   invalidParam: true,  // ❌ Error: Object literal may only specify known properties
  // });

  if (isLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">Error loading posts: {error.message}</div>;
  }

  return (
    <div className="post-list-with-filters">
      <div className="filters">
        <h3>Filter Posts</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="userId">Filter by User ID:</label>
            <input
              id="userId"
              type="number"
              value={userId || ""}
              onChange={(e) =>
                setUserId(e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="All users"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="limit">Limit:</label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button onClick={() => setUserId(undefined)}>Clear Filters</button>
        </div>
      </div>

      <div className="post-list">
        <h3>
          Posts {userId ? `by User ${userId}` : "(All Users)"} - Showing{" "}
          {posts?.length || 0}
        </h3>
        {posts?.map((post: Post) => (
          <div key={post.id} className="post-item">
            <h4>{post.title}</h4>
            <p>{post.body}</p>
            <small>User ID: {post.userId}</small>
          </div>
        ))}
      </div>

      <div className="info-box">
        <h4>💡 Type Safety Benefits</h4>
        <ul>
          <li>✅ Query parameters are fully typed from querySchema</li>
          <li>✅ IDE provides autocompletion for filter options</li>
          <li>✅ TypeScript catches invalid parameter names at compile time</li>
          <li>✅ TypeScript catches wrong parameter types at compile time</li>
          <li>✅ Query keys automatically include params for proper caching</li>
        </ul>
      </div>
    </div>
  );
}
