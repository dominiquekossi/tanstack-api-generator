import { api, type User } from "../api";

interface UserListProps {
  onSelectUser: (userId: number) => void;
}

export function UserList({ onSelectUser }: UserListProps) {
  // GET requests automatically become useQuery hooks
  const { data: users, isLoading, error } = api.users.list.useQuery();

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">Error loading users: {error.message}</div>;
  }

  return (
    <div className="user-list">
      {users?.map((user: User) => (
        <div
          key={user.id}
          className="user-item"
          onClick={() => onSelectUser(user.id)}
        >
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <small>@{user.username}</small>
        </div>
      ))}
    </div>
  );
}
