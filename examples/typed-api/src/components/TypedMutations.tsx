import { useState } from "react";
import { api } from "../api";

/**
 * This component demonstrates typed mutations with bodySchema.
 *
 * Key features:
 * - Full TypeScript autocompletion for request bodies
 * - Compile-time type checking
 * - Runtime validation with Zod
 * - Type-safe response data
 */
export function TypedMutations() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");

  // ============================================================================
  // EXAMPLE 1: Simple mutation with typed body
  // ============================================================================

  const createUser = api.users.create.useMutation({
    onSuccess: (data: any) => {
      // ✅ data is fully typed as User
      console.log("Created user:", data.id, data.name, data.email);
      alert(`User created: ${data.name}`);

      // Clear form
      setName("");
      setEmail("");
      setAge("");
    },
    onError: (error: any) => {
      console.error("Failed to create user:", error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ TypeScript knows the exact shape of the body
    // ✅ IDE provides autocompletion for all properties
    createUser.mutate({
      body: {
        name, // ✅ string - autocompleted
        email, // ✅ string - autocompleted
        age: Number(age), // ✅ number - autocompleted
        role: "user", // ✅ "admin" | "user" | "guest" - autocompleted
      },
    });

    // ❌ This would cause a TypeScript error:
    // createUser.mutate({
    //   body: {
    //     name,
    //     email,
    //     invalidField: "test",  // Error: Object literal may only specify known properties
    //   },
    // });

    // ❌ This would cause a TypeScript error:
    // createUser.mutate({
    //   body: {
    //     name,
    //     email,
    //     age: "30",  // Error: Type 'string' is not assignable to type 'number'
    //   },
    // });
  };

  // ============================================================================
  // EXAMPLE 2: Mutation with path params AND typed body
  // ============================================================================

  const updateUser = api.users.update.useMutation({
    onSuccess: (data: any) => {
      console.log("Updated user:", data);
      alert(`User updated: ${data.name}`);
    },
  });

  const handleUpdateUser = (userId: string) => {
    // ✅ TypeScript enforces both params and body
    updateUser.mutate({
      params: { id: userId }, // ✅ Typed from path template
      body: {
        // ✅ Typed from bodySchema
        name: "Updated Name", // ✅ Optional - autocompleted
        email: "new@email.com", // ✅ Optional - autocompleted
        // All fields are optional in UpdateUserSchema
      },
    });

    // ❌ This would cause a TypeScript error:
    // updateUser.mutate({
    //   params: { id: userId },
    //   body: {
    //     age: "invalid",  // Error: Type 'string' is not assignable to type 'number'
    //   },
    // });
  };

  // ============================================================================
  // EXAMPLE 3: Mutation with only path params (no body)
  // ============================================================================

  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      alert("User deleted successfully");
    },
  });

  const handleDeleteUser = (userId: string) => {
    // ✅ Only params needed, no body
    deleteUser.mutate({ params: { id: userId } });

    // ❌ This would cause a TypeScript error:
    // deleteUser.mutate({
    //   params: { id: userId },
    //   body: {},  // Error: 'body' does not exist in type
    // });
  };

  // ============================================================================
  // EXAMPLE 4: Complex nested data with arrays
  // ============================================================================

  const createPost = api.posts.create.useMutation({
    onSuccess: (data: any) => {
      console.log("Created post:", data);
    },
  });

  const handleCreatePost = () => {
    // ✅ Complex nested structures are fully typed
    createPost.mutate({
      body: {
        title: "My Post",
        content: "This is the content of my post.",
        status: "published", // ✅ "draft" | "published" - autocompleted
        tags: ["typescript", "react", "api"], // ✅ string[] - autocompleted
      },
    });

    // ❌ This would cause a TypeScript error:
    // createPost.mutate({
    //   body: {
    //     title: "My Post",
    //     content: "Content",
    //     status: "invalid",  // Error: Type '"invalid"' is not assignable to type '"draft" | "published"'
    //   },
    // });
  };

  return (
    <div className="typed-mutations">
      <h2>Typed Mutations Demo</h2>

      <div className="section">
        <h3>Create User (Typed Body)</h3>
        <form onSubmit={handleCreateUser}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
          <button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? "Creating..." : "Create User"}
          </button>
        </form>

        {createUser.isError && (
          <div className="error">Error: {createUser.error.message}</div>
        )}
      </div>

      <div className="section">
        <h3>Update User (Path Params + Typed Body)</h3>
        <button onClick={() => handleUpdateUser("123")}>Update User 123</button>
      </div>

      <div className="section">
        <h3>Delete User (Path Params Only)</h3>
        <button onClick={() => handleDeleteUser("123")}>Delete User 123</button>
      </div>

      <div className="section">
        <h3>Create Post (Complex Nested Data)</h3>
        <button onClick={handleCreatePost}>Create Sample Post</button>
      </div>

      <div className="info-box">
        <h4>💡 Type Safety Benefits</h4>
        <ul>
          <li>✅ Full IDE autocompletion for all properties</li>
          <li>✅ Compile-time errors for invalid data</li>
          <li>✅ Runtime validation with Zod schemas</li>
          <li>✅ No manual type casting needed</li>
          <li>✅ Refactoring safety - changes propagate automatically</li>
        </ul>
      </div>
    </div>
  );
}
