import type { z } from "zod";

/**
 * HTTP methods supported by the QueryAPI System
 */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Base endpoint configuration defining a single API endpoint
 *
 * @example
 * ```typescript
 * // GET endpoint with query parameters
 * const listUsers = {
 *   method: 'GET',
 *   path: '/users',
 *   querySchema: z.object({
 *     page: z.number().optional(),
 *     limit: z.number().optional(),
 *   }),
 *   schema: z.array(UserSchema),
 * };
 *
 * // POST endpoint with request body
 * const createUser = {
 *   method: 'POST',
 *   path: '/users',
 *   bodySchema: z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   }),
 *   schema: UserSchema,
 * };
 *
 * // PUT endpoint with path params and body
 * const updateUser = {
 *   method: 'PUT',
 *   path: '/users/:id',
 *   bodySchema: z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   }),
 *   schema: UserSchema,
 * };
 * ```
 */
export type EndpointConfig = {
  /** HTTP method for this endpoint */
  method: HTTPMethod;
  /** URL path template (e.g., "/users/:id") */
  path: string;
  /** Optional Zod schema for response validation and type inference */
  schema?: z.ZodSchema;
  /** Optional Zod schema for request body validation and type inference (POST/PUT/PATCH only) */
  bodySchema?: z.ZodSchema;
  /** Optional Zod schema for query parameter validation and type inference */
  querySchema?: z.ZodSchema;
};

/**
 * Type-level validation for bodySchema usage
 *
 * Ensures that bodySchema is only used with POST, PUT, or PATCH methods.
 * Generates a TypeScript compilation error for invalid combinations.
 *
 * @example
 * ```typescript
 * // ✅ Valid: POST with bodySchema
 * const valid1: ValidateEndpointConfig<{
 *   method: 'POST',
 *   path: '/users',
 *   bodySchema: z.ZodObject<any>
 * }> = { method: 'POST', path: '/users', bodySchema: z.object({}) };
 *
 * // ❌ Invalid: GET with bodySchema (compilation error)
 * const invalid: ValidateEndpointConfig<{
 *   method: 'GET',
 *   path: '/users',
 *   bodySchema: z.ZodObject<any>
 * }> = { method: 'GET', path: '/users', bodySchema: z.object({}) };
 * // Error: Type does not satisfy the constraint
 * ```
 */
export type ValidateEndpointConfig<T extends EndpointConfig> = T extends {
  method: "GET" | "DELETE";
  bodySchema: z.ZodSchema;
}
  ? {
      error: "bodySchema is not allowed for GET or DELETE methods. Only POST, PUT, and PATCH methods can have a request body.";
      receivedMethod: T["method"];
      suggestion: "Remove the bodySchema property or change the method to POST, PUT, or PATCH";
    }
  : T;

/**
 * API configuration structure supporting nested endpoint groups
 *
 * @example
 * ```typescript
 * const config = {
 *   users: {
 *     list: { method: 'GET', path: '/users' },
 *     get: { method: 'GET', path: '/users/:id' },
 *   }
 * } as const;
 * ```
 */
export type APIConfig = {
  [group: string]:
    | {
        [endpoint: string]: EndpointConfig;
      }
    | EndpointConfig;
};

/**
 * Validated API configuration with compile-time checks
 *
 * Applies type-level validation to ensure bodySchema is only used with appropriate HTTP methods.
 *
 * @example
 * ```typescript
 * // ✅ Valid configuration
 * const validConfig: ValidatedAPIConfig = {
 *   users: {
 *     create: { method: 'POST', path: '/users', bodySchema: z.object({}) }
 *   }
 * };
 *
 * // ❌ Invalid configuration (compilation error)
 * const invalidConfig: ValidatedAPIConfig = {
 *   users: {
 *     list: { method: 'GET', path: '/users', bodySchema: z.object({}) }
 *   }
 * };
 * ```
 */
export type ValidatedAPIConfig = {
  [group: string]:
    | {
        [endpoint: string]: ValidateEndpointConfig<EndpointConfig>;
      }
    | ValidateEndpointConfig<EndpointConfig>;
};

/**
 * Configuration for the fetch wrapper
 */
export type FetchConfig = {
  /** Base URL prepended to all requests */
  baseURL?: string;
  /** Default headers included in all requests */
  headers?: Record<string, string>;
  /** Interceptor executed before each request */
  beforeRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  /** Interceptor executed after each response */
  afterResponse?: (response: Response) => Response | Promise<Response>;
};

/**
 * Structured error object for API errors
 */
export type APIError = {
  status: number;
  statusText: string;
  message: string;
  data?: unknown;
};

/**
 * Validation error from Zod schema validation
 */
export type ValidationError = {
  type: "validation";
  errors: z.ZodError;
};

/**
 * Options for fetch requests
 *
 * @template TBody - Type of the request body
 * @template TQuery - Type of the query parameters
 *
 * @example
 * ```typescript
 * // With typed body and query
 * const options: FetchOptions<CreateUser, UserFilter> = {
 *   method: 'POST',
 *   body: { name: 'John', email: 'john@example.com' },
 *   query: { page: 1, limit: 10 },
 *   bodySchema: CreateUserSchema,
 * };
 * ```
 */
export type FetchOptions<TBody = unknown, TQuery = unknown> = {
  method: string;
  body?: TBody;
  params?: Record<string, string | number>;
  query?: TQuery;
  signal?: AbortSignal;
  schema?: z.ZodSchema;
  bodySchema?: z.ZodSchema;
};

/**
 * Fetcher function type
 *
 * @template TResponse - Type of the response data
 * @template TBody - Type of the request body
 * @template TQuery - Type of the query parameters
 *
 * @example
 * ```typescript
 * const fetcher: FetcherFunction = createFetcher({ baseURL: 'https://api.example.com' });
 *
 * // Typed request with body and query
 * const user = await fetcher<User, CreateUser, UserFilter>('/users', {
 *   method: 'POST',
 *   body: { name: 'John', email: 'john@example.com' },
 *   query: { notify: true },
 * });
 * ```
 */
export type FetcherFunction = <
  TResponse = unknown,
  TBody = unknown,
  TQuery = unknown
>(
  path: string,
  options?: FetchOptions<TBody, TQuery>
) => Promise<TResponse>;

// ============================================================================
// Type Inference Utilities
// ============================================================================

/**
 * Extract path parameters from a URL path template
 *
 * Parses path templates with colon-prefixed parameters (e.g., "/users/:id")
 * and extracts parameter names as a typed object.
 *
 * @example
 * ```typescript
 * type Params1 = ExtractParams<"/users/:id">; // { id: string | number }
 * type Params2 = ExtractParams<"/users/:userId/posts/:postId">; // { userId: string | number, postId: string | number }
 * type Params3 = ExtractParams<"/users">; // {} (no params)
 * ```
 */
export type ExtractParams<TPath extends string> =
  // Handle multiple parameters: match pattern with param followed by more path segments
  TPath extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string | number } & ExtractParams<`/${Rest}`>
    : // Handle single parameter at end of path
    TPath extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string | number }
    : // No parameters found - return empty object
      {};

/**
 * Infer response type from endpoint configuration
 *
 * If a Zod schema is provided, infers the type from the schema.
 * Otherwise, returns unknown type.
 *
 * @example
 * ```typescript
 * type Response1 = InferResponse<{ schema: z.ZodObject<{ id: z.ZodNumber }> }>; // { id: number }
 * type Response2 = InferResponse<{ method: 'GET', path: '/users' }>; // unknown
 * ```
 */
export type InferResponse<TEndpoint> = TEndpoint extends {
  schema: z.ZodSchema<infer T>;
}
  ? T
  : unknown;

/**
 * Infer request body type from endpoint configuration
 *
 * Only endpoints with POST, PUT, or PATCH methods can have request bodies.
 * If a bodySchema is provided, infers the type from the Zod schema.
 * Otherwise, returns unknown for backward compatibility.
 * For other methods, the body type is never (not allowed).
 *
 * @example
 * ```typescript
 * // With bodySchema
 * type Body1 = InferBody<{
 *   method: 'POST',
 *   bodySchema: z.ZodObject<{ name: z.ZodString, age: z.ZodNumber }>
 * }>; // { name: string, age: number }
 *
 * // Without bodySchema (backward compatible)
 * type Body2 = InferBody<{ method: 'POST' }>; // unknown
 *
 * // GET method (body not allowed)
 * type Body3 = InferBody<{ method: 'GET' }>; // never
 * ```
 */
export type InferBody<TEndpoint> = TEndpoint extends {
  method: "POST" | "PUT" | "PATCH";
}
  ? TEndpoint extends { bodySchema: z.ZodSchema<infer T> }
    ? T // Infer from bodySchema if provided
    : unknown // Fallback to unknown for backward compatibility
  : never; // Body not allowed for GET/DELETE

/**
 * Infer query parameter type from endpoint configuration
 *
 * If a querySchema is provided, infers the type from the Zod schema.
 * Otherwise, returns a flexible record type supporting common query parameter types.
 *
 * @example
 * ```typescript
 * // With querySchema
 * type Query1 = InferQuery<{
 *   querySchema: z.ZodObject<{ page: z.ZodNumber, search: z.ZodString }>
 * }>; // { page: number, search: string }
 *
 * // Without querySchema (flexible fallback)
 * type Query2 = InferQuery<{ method: 'GET', path: '/users' }>;
 * // Record<string, string | number | boolean | undefined>
 * ```
 */
export type InferQuery<TEndpoint> = TEndpoint extends {
  querySchema: z.ZodSchema<infer T>;
}
  ? T
  : Record<string, string | number | boolean | undefined>;
