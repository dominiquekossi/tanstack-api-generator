import { api, type Post } from "../api";

export function PostList() {
  const { data: posts, isLoading, error } = api.posts.list.useQuery();

  if (isLoading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">Error loading posts: {error.message}</div>;
  }

  return (
    <div className="post-list">
      {posts?.slice(0, 10).map((post: Post) => (
        <div key={post.id} className="post-item">
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <small>User ID: {post.userId}</small>
        </div>
      ))}
    </div>
  );
}
