import { createQueryAPI } from "tanstack-api-generator";
import { z } from "zod";

// Define Zod schemas for type safety
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  username: z.string(),
});

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  userId: z.number(),
});

// Create the API with full type inference
export const api = createQueryAPI(
  {
    users: {
      list: {
        method: "GET",
        path: "/users",
        schema: z.array(UserSchema),
      },
      get: {
        method: "GET",
        path: "/users/:id",
        schema: UserSchema,
      },
      create: {
        method: "POST",
        path: "/users",
        schema: UserSchema,
      },
      update: {
        method: "PUT",
        path: "/users/:id",
        schema: UserSchema,
      },
      delete: {
        method: "DELETE",
        path: "/users/:id",
      },
    },
    posts: {
      list: {
        method: "GET",
        path: "/posts",
        schema: z.array(PostSchema),
      },
      get: {
        method: "GET",
        path: "/posts/:id",
        schema: PostSchema,
      },
      byUser: {
        method: "GET",
        path: "/users/:userId/posts",
        schema: z.array(PostSchema),
      },
    },
  } as const,
  {
    baseURL: "https://jsonplaceholder.typicode.com",
    beforeRequest: async (config) => {
      // Example: Add authentication token
      console.log("Making request:", config);
      return config;
    },
    afterResponse: async (response) => {
      // Example: Log responses
      console.log("Received response:", response.status);
      return response;
    },
  }
);

// Export types inferred from schemas
export type User = z.infer<typeof UserSchema>;
export type Post = z.infer<typeof PostSchema>;
