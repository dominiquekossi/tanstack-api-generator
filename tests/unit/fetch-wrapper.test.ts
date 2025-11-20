import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFetcher } from "../../src/fetch/createFetcher";
import { z } from "zod";

describe("Fetch Wrapper", () => {
  // Mock global fetch
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("createFetcher", () => {
    it("should create a fetcher function", () => {
      const fetcher = createFetcher();
      expect(typeof fetcher).toBe("function");
    });

    it("should make basic GET request", async () => {
      const mockResponse = { id: 1, name: "John" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      });

      const fetcher = createFetcher({ baseURL: "https://api.example.com" });
      const result = await fetcher("/users", { method: "GET" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users",
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should replace single path parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 123 }),
      });

      const fetcher = createFetcher({ baseURL: "https://api.example.com" });
      await fetcher("/users/:id", { method: "GET", params: { id: 123 } });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users/123",
        expect.any(Object)
      );
    });

    it("should replace multiple path parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      const fetcher = createFetcher({ baseURL: "https://api.example.com" });
      await fetcher("/users/:userId/posts/:postId", {
        method: "GET",
        params: { userId: 1, postId: 2 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/users/1/posts/2",
        expect.any(Object)
      );
    });

    it("should throw error when required parameter is missing", async () => {
      const fetcher = createFetcher();

      await expect(
        fetcher("/users/:id", { method: "GET", params: {} })
      ).rejects.toThrow("Missing required path parameter: id");
    });

    it("should execute beforeRequest interceptor", async () => {
      const beforeRequest = vi.fn(async (config) => {
        return {
          ...config,
          headers: { ...config.headers, Authorization: "Bearer token" },
        };
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      const fetcher = createFetcher({ beforeRequest });
      await fetcher("/users", { method: "GET" });

      expect(beforeRequest).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token" }),
        })
      );
    });

    it("should execute afterResponse interceptor", async () => {
      const afterResponse = vi.fn(async (response) => response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      const fetcher = createFetcher({ afterResponse });
      await fetcher("/users", { method: "GET" });

      expect(afterResponse).toHaveBeenCalled();
    });

    it("should include custom headers in request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      const fetcher = createFetcher({
        headers: { "X-Custom-Header": "value" },
      });
      await fetcher("/users", { method: "GET" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Custom-Header": "value" }),
        })
      );
    });

    it("should serialize JSON body for POST request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      const fetcher = createFetcher();
      const body = { name: "John", email: "john@example.com" };
      await fetcher("/users", { method: "POST", body });

      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should serialize JSON body for PUT request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      const fetcher = createFetcher();
      const body = { name: "John Updated" };
      await fetcher("/users/:id", { method: "PUT", params: { id: 1 }, body });

      expect(mockFetch).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(body),
        })
      );
    });

    it("should serialize JSON body for PATCH request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1 }),
      });

      const fetcher = createFetcher();
      const body = { name: "John Patched" };
      await fetcher("/users/:id", { method: "PATCH", params: { id: 1 }, body });

      expect(mockFetch).toHaveBeenCalledWith(
        "/users/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
        })
      );
    });

    it("should handle AbortSignal for request cancellation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      const fetcher = createFetcher();
      const controller = new AbortController();
      await fetcher("/users", { method: "GET", signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({ signal: controller.signal })
      );
    });

    it("should map HTTP 404 error to APIError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "User not found" }),
        text: async () => JSON.stringify({ message: "User not found" }),
      });

      const fetcher = createFetcher();

      await expect(
        fetcher("/users/:id", { method: "GET", params: { id: 999 } })
      ).rejects.toMatchObject({
        status: 404,
        statusText: "Not Found",
        message: "HTTP 404: Not Found",
        data: { message: "User not found" },
      });
    });

    it("should map HTTP 500 error to APIError", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ error: "Server error" }),
        text: async () => JSON.stringify({ error: "Server error" }),
      });

      const fetcher = createFetcher();

      await expect(fetcher("/users", { method: "GET" })).rejects.toMatchObject({
        status: 500,
        statusText: "Internal Server Error",
        message: "HTTP 500: Internal Server Error",
      });
    });

    it("should map network error to APIError", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const fetcher = createFetcher();

      await expect(fetcher("/users", { method: "GET" })).rejects.toMatchObject({
        status: 0,
        statusText: "Network Error",
        message: "Network failure",
      });
    });

    it("should validate response with Zod schema", async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: 1, name: "John" }),
      });

      const fetcher = createFetcher();
      const result = await fetcher("/users/:id", {
        method: "GET",
        params: { id: 1 },
        schema,
      });

      expect(result).toEqual({ id: 1, name: "John" });
    });

    it("should throw ValidationError when schema validation fails", async () => {
      const schema = z.object({
        id: z.number(),
        name: z.string(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "not-a-number", name: "John" }),
      });

      const fetcher = createFetcher();

      await expect(
        fetcher("/users/:id", { method: "GET", params: { id: 1 }, schema })
      ).rejects.toMatchObject({
        type: "validation",
      });
    });

    it("should skip validation when no schema is provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ anything: "goes" }),
      });

      const fetcher = createFetcher();
      const result = await fetcher("/users", { method: "GET" });

      expect(result).toEqual({ anything: "goes" });
    });

    it("should parse JSON response automatically", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      const fetcher = createFetcher();
      const result = await fetcher("/users", { method: "GET" });

      expect(result).toEqual({ data: "test" });
    });

    it("should handle text response when content-type is not JSON", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/plain" }),
        text: async () => "plain text response",
      });

      const fetcher = createFetcher();
      const result = await fetcher("/health", { method: "GET" });

      expect(result).toBe("plain text response");
    });
  });
});
