import { useState } from "react";
import { UserList } from "./components/UserList";
import { UserDetail } from "./components/UserDetail";
import { CreateUser } from "./components/CreateUser";
import { PostList } from "./components/PostList";
import { QueryKeyDemo } from "./components/QueryKeyDemo";
import { AdvancedQueryFeatures } from "./components/AdvancedQueryFeatures";

function App() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [view, setView] = useState<
    "users" | "posts" | "advanced" | "properties"
  >("users");

  return (
    <div className="app">
      <header>
        <h1>@tanstack-auto/query-api Example</h1>
        <p>Demonstrating automatic hook generation with TanStack Query</p>
      </header>

      <nav>
        <button
          onClick={() => setView("users")}
          className={view === "users" ? "active" : ""}
        >
          Users
        </button>
        <button
          onClick={() => setView("posts")}
          className={view === "posts" ? "active" : ""}
        >
          Posts
        </button>
        <button
          onClick={() => setView("properties")}
          className={view === "properties" ? "active" : ""}
        >
          Properties
        </button>
        <button
          onClick={() => setView("advanced")}
          className={view === "advanced" ? "active" : ""}
        >
          Keys & Cache
        </button>
      </nav>

      <main>
        {view === "users" ? (
          <div className="users-view">
            <div className="panel">
              <h2>User List</h2>
              <UserList onSelectUser={setSelectedUserId} />
            </div>

            {selectedUserId && (
              <div className="panel">
                <h2>User Detail</h2>
                <UserDetail userId={selectedUserId} />
              </div>
            )}

            <div className="panel">
              <h2>Create User</h2>
              <CreateUser />
            </div>
          </div>
        ) : view === "posts" ? (
          <div className="posts-view">
            <div className="panel">
              <h2>Post List</h2>
              <PostList />
            </div>
          </div>
        ) : view === "properties" ? (
          <div className="advanced-view">
            <div className="panel">
              <AdvancedQueryFeatures />
            </div>
          </div>
        ) : (
          <div className="advanced-view">
            <div className="panel">
              <QueryKeyDemo />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
