import { describe, it, expect } from "vitest";
import { createKeyFactory } from "../../src/keys/createKeyFactory";

describe("Query Key Factory", () => {
  it("should generate keys for simple endpoints", () => {
    const config = {
      users: {
        list: { method: "GET" as const, path: "/users" },
      },
    };

    const keyFactory = createKeyFactory(config);

    expect(keyFactory.users.list.key()).toEqual(["users", "list"]);
  });

  it("should generate keys with parameters", () => {
    const config = {
      users: {
        get: { method: "GET" as const, path: "/users/:id" },
      },
    };

    const keyFactory = createKeyFactory(config);

    expect(keyFactory.users.get.key({ id: "123" })).toEqual([
      "users",
      "get",
      { id: "123" },
    ]);
  });

  it("should generate keys for nested groups", () => {
    const config = {
      users: {
        list: { method: "GET" as const, path: "/users" },
        get: { method: "GET" as const, path: "/users/:id" },
      },
      posts: {
        list: { method: "GET" as const, path: "/posts" },
      },
    };

    const keyFactory = createKeyFactory(config);

    expect(keyFactory.users.list.key()).toEqual(["users", "list"]);
    expect(keyFactory.users.get.key({ id: "1" })).toEqual([
      "users",
      "get",
      { id: "1" },
    ]);
    expect(keyFactory.posts.list.key()).toEqual(["posts", "list"]);
  });

  it("should generate deterministic keys", () => {
    const config = {
      users: {
        get: { method: "GET" as const, path: "/users/:id" },
      },
    };

    const keyFactory = createKeyFactory(config);

    const key1 = keyFactory.users.get.key({ id: "123" });
    const key2 = keyFactory.users.get.key({ id: "123" });

    expect(key1).toEqual(key2);
  });

  it("should handle multiple parameters", () => {
    const config = {
      posts: {
        byUser: {
          method: "GET" as const,
          path: "/users/:userId/posts/:postId",
        },
      },
    };

    const keyFactory = createKeyFactory(config);

    expect(keyFactory.posts.byUser.key({ userId: "1", postId: "2" })).toEqual([
      "posts",
      "byUser",
      { userId: "1", postId: "2" },
    ]);
  });
});
