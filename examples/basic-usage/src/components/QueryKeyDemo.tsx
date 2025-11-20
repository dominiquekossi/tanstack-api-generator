import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

/**
 * This component demonstrates:
 * - Manual query invalidation
 * - Query key generation and usage
 * - Direct cache manipulation
 */
export function QueryKeyDemo() {
  const [userId, setUserId] = useState("1");
  const queryClient = useQueryClient();

  // Demonstrate query key generation
  const userListKey = api.users.list.key();
  const userDetailKey = api.users.get.key({ id: Number(userId) });
  const postsByUserKey = api.posts.byUser.key({ userId: Number(userId) });

  // Manual invalidation examples
  const handleInvalidateUserList = async () => {
    await api.users.invalidate.list();
    alert("User list invalidated! It will refetch on next access.");
  };

  const handleInvalidateSpecificUser = async () => {
    await api.users.invalidate.get({ id: Number(userId) });
    alert(`User ${userId} invalidated!`);
  };

  const handleInvalidateAllUsers = async () => {
    await api.users.invalidate.all();
    alert("All user queries invalidated!");
  };

  const handleInvalidateAllPosts = async () => {
    await api.posts.invalidate.all();
    alert("All post queries invalidated!");
  };

  // Direct cache inspection
  const inspectCache = () => {
    const cache = queryClient.getQueryCache().getAll();
    console.log("Current query cache:", cache);
    alert(`Cache contains ${cache.length} queries. Check console for details.`);
  };

  return (
    <div className="query-key-demo">
      <h2>Query Keys & Manual Invalidation</h2>

      <div className="demo-section">
        <h3>Generated Query Keys</h3>
        <div className="key-display">
          <div className="key-item">
            <strong>User List Key:</strong>
            <code>{JSON.stringify(userListKey)}</code>
          </div>
          <div className="key-item">
            <strong>User Detail Key (ID: {userId}):</strong>
            <code>{JSON.stringify(userDetailKey)}</code>
          </div>
          <div className="key-item">
            <strong>Posts by User Key (User ID: {userId}):</strong>
            <code>{JSON.stringify(postsByUserKey)}</code>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="userId">Change User ID:</label>
          <input
            id="userId"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            min="1"
            max="10"
          />
        </div>
      </div>

      <div className="demo-section">
        <h3>Manual Invalidation</h3>
        <p className="description">
          Invalidation tells TanStack Query to refetch data. Mutations do this
          automatically, but you can also trigger it manually.
        </p>
        <div className="button-grid">
          <button onClick={handleInvalidateUserList} className="btn-action">
            Invalidate User List
          </button>
          <button onClick={handleInvalidateSpecificUser} className="btn-action">
            Invalidate User {userId}
          </button>
          <button onClick={handleInvalidateAllUsers} className="btn-action">
            Invalidate All Users
          </button>
          <button onClick={handleInvalidateAllPosts} className="btn-action">
            Invalidate All Posts
          </button>
        </div>
      </div>

      <div className="demo-section">
        <h3>Cache Inspection</h3>
        <p className="description">
          View the current state of the TanStack Query cache in the console.
        </p>
        <button onClick={inspectCache} className="btn-action">
          Inspect Cache (Console)
        </button>
      </div>

      <div className="demo-section info-box">
        <h4>💡 Key Concepts</h4>
        <ul>
          <li>
            <strong>Hierarchical Keys:</strong> Keys follow the pattern [group,
            endpoint, params]
          </li>
          <li>
            <strong>Deterministic:</strong> Same params always generate the same
            key
          </li>
          <li>
            <strong>Automatic Invalidation:</strong> POST invalidates lists,
            PUT/PATCH/DELETE invalidate lists and specific items
          </li>
          <li>
            <strong>Manual Control:</strong> Use invalidate methods when you
            need custom cache management
          </li>
        </ul>
      </div>
    </div>
  );
}
