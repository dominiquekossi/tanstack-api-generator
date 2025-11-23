import { useState } from "react";
import { TypedMutations } from "./components/TypedMutations";
import { TypedQueries } from "./components/TypedQueries";
import { TypeErrorExamples } from "./components/TypeErrorExamples";
import "./App.css";

function App() {
  const [view, setView] = useState<"mutations" | "queries" | "errors">(
    "mutations"
  );

  return (
    <div className="app">
      <header>
        <h1>🎯 Typed API Example</h1>
        <p>Full type safety with bodySchema and querySchema</p>
      </header>

      <nav>
        <button
          onClick={() => setView("mutations")}
          className={view === "mutations" ? "active" : ""}
        >
          Typed Mutations
        </button>
        <button
          onClick={() => setView("queries")}
          className={view === "queries" ? "active" : ""}
        >
          Typed Queries
        </button>
        <button
          onClick={() => setView("errors")}
          className={view === "errors" ? "active" : ""}
        >
          Type Errors
        </button>
      </nav>

      <main>
        {view === "mutations" && <TypedMutations />}
        {view === "queries" && <TypedQueries />}
        {view === "errors" && <TypeErrorExamples />}
      </main>

      <footer>
        <p>
          This example demonstrates the full type safety features of
          tanstack-api-generator. Check the source code to see how bodySchema
          and querySchema provide complete TypeScript autocompletion and
          compile-time type checking.
        </p>
      </footer>
    </div>
  );
}

export default App;
