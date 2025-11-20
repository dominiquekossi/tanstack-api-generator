import { useState } from "react";
import { api, type Post } from "../api";

interface UserDetailProps {
  userId: number;
}

export function UserDetail({ userId }: UserDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Path parameters are automatically typed and required
  const { data: user, isLoading } = api.users.get.useQuery({ id: userId });

  // Fetch posts by this user
  const { data: posts } = api.posts.byUser.useQuery({ userId });

  // Demonstrate UPDATE mutation
  const updateUser = api.users.update.useMutation({
    onSuccess: (data: {
      id: number;
      name: string;
      email: string;
      username: string;
    }) => {
      console.log("User updated:", data);
      alert("User updated successfully!");
      setIsEditing(false);
      // Automatic invalidation will refresh the user detail and list
    },
  });

  // Demonstrate DELETE mutation
  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      alert("User deleted successfully!");
      // Automatic invalidation will refresh the user list
    },
  });

  const handleEdit = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsEditing(true);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate({
      params: { id: userId },
      body: { name, email, username: user?.username || "" },
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate({ params: { id: userId } });
    }
  };

  if (isLoading) {
    return <div className="loading">Loading user details...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="user-detail">
      {!isEditing ? (
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>Email: {user.email}</p>
          <p>Username: @{user.username}</p>
          <div className="user-actions">
            <button onClick={handleEdit} className="btn-edit">
              Edit User
            </button>
            <button
              onClick={handleDelete}
              className="btn-delete"
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="edit-user-form">
          <div className="form-group">
            <label htmlFor="edit-name">Name:</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-email">Email:</label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Updating..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {posts && posts.length > 0 && (
        <div className="user-posts">
          <h4>Posts by {user.name}</h4>
          <ul>
            {posts.map((post: Post) => (
              <li key={post.id}>
                <strong>{post.title}</strong>
                <p>{post.body.substring(0, 100)}...</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
