import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createInvalidation } from "../../src/invalidation/createInvalidation";
import { createKeyFactory } from "../../src/keys/createKeyFactory";

describe("Invalidation Engine", () => {
  describe("createInvalidation", () => {
    it("should create invalidation utilities matching config structure", () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const queryClient = new QueryClient();
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      expect(invalidation.users).toBeDefined();
      expect(invalidation.users.invalidate).toBeDefined();
      expect(invalidation.users.invalidate.all).toBeDefined();
      expect(invalidation.users.invalidate.list).toBeDefined();
      expect(invalidation.users.invalidate.get).toBeDefined();
    });

    it("should invalidate specific query with parameters", async () => {
      const config = {
        users: {
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.get({ id: "123" });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users", "get", { id: "123" }],
      });
    });

    it("should invalidate query without parameters", async () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.list();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users", "list"],
      });
    });

    it("should invalidate all queries in a group", async () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.all();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users"],
      });
    });

    it("should handle multiple endpoint groups", async () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
        },
        posts: {
          list: { method: "GET" as const, path: "/posts" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.list();
      await invalidation.posts.invalidate.list();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users", "list"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["posts", "list"],
      });
    });

    it("should handle direct endpoint at group level", async () => {
      const config = {
        health: { method: "GET" as const, path: "/health" },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.health.invalidate();

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["health", "health"],
      });
    });

    it("should invalidate queries with multiple parameters", async () => {
      const config = {
        posts: {
          getComment: {
            method: "GET" as const,
            path: "/posts/:postId/comments/:commentId",
          },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.posts.invalidate.getComment({
        postId: "1",
        commentId: "2",
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["posts", "getComment", { commentId: "2", postId: "1" }],
      });
    });

    it("should support invalidating different endpoints independently", async () => {
      const config = {
        users: {
          list: { method: "GET" as const, path: "/users" },
          get: { method: "GET" as const, path: "/users/:id" },
          posts: { method: "GET" as const, path: "/users/:id/posts" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.list();
      await invalidation.users.invalidate.get({ id: "123" });
      await invalidation.users.invalidate.posts({ id: "123" });

      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(1, {
        queryKey: ["users", "list"],
      });
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(2, {
        queryKey: ["users", "get", { id: "123" }],
      });
      expect(invalidateQueriesSpy).toHaveBeenNthCalledWith(3, {
        queryKey: ["users", "posts", { id: "123" }],
      });
    });

    it("should handle numeric parameter values", async () => {
      const config = {
        users: {
          get: { method: "GET" as const, path: "/users/:id" },
        },
      };

      const queryClient = new QueryClient();
      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
      const keyFactory = createKeyFactory(config);
      const invalidation = createInvalidation(config, queryClient, keyFactory);

      await invalidation.users.invalidate.get({ id: 123 });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["users", "get", { id: 123 }],
      });
    });
  });
});
