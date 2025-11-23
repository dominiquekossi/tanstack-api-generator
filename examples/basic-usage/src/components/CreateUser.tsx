import { useState } from "react";
import { api } from "../api";

export function CreateUser() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // POST/PUT/PATCH/DELETE requests become useMutation hooks
  // ✅ NEW: Body is now fully typed from bodySchema
  const createUser = api.users.create.useMutation({
    onSuccess: (data) => {
      // ✅ data is fully typed as User
      console.log("User created:", data);
      alert(`User created successfully! ID: ${data.id}`);
      // Clear form
      setName("");
      setEmail("");
      setUsername("");
    },
    onError: (error: Error) => {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mutations automatically invalidate related queries
    // This will refresh the user list after creation
    // ✅ NEW: Body is fully typed with autocompletion
    createUser.mutate({
      body: {
        name, // ✅ Typed as string
        email, // ✅ Typed as string (email format)
        username, // ✅ Typed as string
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="create-user-form">
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Create User"}
      </button>

      {createUser.isError && (
        <div className="error">Error: {createUser.error.message}</div>
      )}
    </form>
  );
}
