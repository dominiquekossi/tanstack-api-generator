import type { z } from "zod";

/**
 * HTTP methods supported by the QueryAPI System
 */
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Base endpoint configuration defining a single API endpoint
 */
export type EndpointConfig = {
  /** HTTP method for this endpoint */
  method: HTTPMethod;
  /** URL path template (e.g., "/users/:id") */
  path: string;
  /** Optional Zod schema for response validation */
  schema?: z.ZodSchema;
};

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
 */
export type FetchOptions<TBody = unknown> = {
  method: string;
  body?: TBody;
  params?: Record<string, string | number>;
  signal?: AbortSignal;
  schema?: z.ZodSchema;
};

/**
 * Fetcher function type
 */
export type FetcherFunction = <TResponse = unknown, TBody = unknown>(
  path: string,
  options?: FetchOptions<TBody>
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
 * For other methods, the body type is never (not allowed).
 *
 * @example
 * ```typescript
 * type Body1 = InferBody<{ method: 'POST' }>; // unknown (body allowed)
 * type Body2 = InferBody<{ method: 'GET' }>; // never (body not allowed)
 * ```
 */
export type InferBody<TEndpoint> = TEndpoint extends {
  method: "POST" | "PUT" | "PATCH";
}
  ? unknown
  : never;
