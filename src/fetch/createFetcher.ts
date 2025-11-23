import type {
  FetchConfig,
  FetcherFunction,
  FetchOptions,
  APIError,
  ValidationError,
} from "../types";

/**
 * Creates a configured fetcher function with interceptor support
 *
 * @param config - Fetch configuration with baseURL, headers, and interceptors
 * @returns Typed fetcher function for making HTTP requests
 *
 * @example
 * ```typescript
 * const fetcher = createFetcher({
 *   baseURL: 'https://api.example.com',
 *   headers: { 'Content-Type': 'application/json' },
 *   beforeRequest: async (config) => {
 *     config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
 *     return config;
 *   }
 * });
 *
 * const data = await fetcher('/users/:id', {
 *   method: 'GET',
 *   params: { id: 123 }
 * });
 * ```
 */
export function createFetcher(config: FetchConfig = {}): FetcherFunction {
  const {
    baseURL = "",
    headers: defaultHeaders = {},
    beforeRequest,
    afterResponse,
  } = config;

  return async function fetcher<
    TResponse = unknown,
    TBody = unknown,
    TQuery = unknown
  >(
    path: string,
    options: FetchOptions<TBody, TQuery> = { method: "GET" }
  ): Promise<TResponse> {
    const {
      method = "GET",
      body,
      params,
      query,
      signal,
      schema,
      bodySchema,
    } = options;

    // Replace path parameters with actual values
    let finalPath = replacePath(path, params);

    // Add query parameters to the path
    if (query) {
      const queryString = buildQueryString(query);
      if (queryString) {
        finalPath += (finalPath.includes("?") ? "&" : "?") + queryString;
      }
    }

    // Construct full URL
    const url = baseURL + finalPath;

    // Build request configuration
    let requestInit: RequestInit = {
      method,
      headers: {
        ...defaultHeaders,
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      signal,
    };

    // Validate and add body for mutation methods
    if (
      body !== undefined &&
      (method === "POST" || method === "PUT" || method === "PATCH")
    ) {
      // Validate body against bodySchema if provided
      if (bodySchema) {
        const result = bodySchema.safeParse(body);
        if (!result.success) {
          const validationError: ValidationError = {
            type: "validation",
            errors: result.error,
          };
          throw validationError;
        }
      }
      requestInit.body = JSON.stringify(body);
    }

    // Execute beforeRequest interceptor
    if (beforeRequest) {
      requestInit = await beforeRequest(requestInit);
    }

    try {
      // Make the fetch call
      let response = await fetch(url, requestInit);

      // Execute afterResponse interceptor
      if (afterResponse) {
        response = await afterResponse(response);
      }

      // Handle HTTP error status codes
      if (!response.ok) {
        const errorData = await parseResponseData(response);
        const error: APIError = {
          status: response.status,
          statusText: response.statusText,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
        };
        throw error;
      }

      // Parse and return response data
      const data = await parseResponseData(response);

      // Validate response data against schema if provided
      if (schema) {
        const result = schema.safeParse(data);
        if (!result.success) {
          const validationError: ValidationError = {
            type: "validation",
            errors: result.error,
          };
          throw validationError;
        }
        return result.data as TResponse;
      }

      return data as TResponse;
    } catch (error) {
      // If it's already an APIError or ValidationError, rethrow it
      if (isAPIError(error) || isValidationError(error)) {
        throw error;
      }

      // Map network errors to APIError
      const apiError: APIError = {
        status: 0,
        statusText: "Network Error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
        data: undefined,
      };
      throw apiError;
    }
  };
}

/**
 * Replace path parameters with actual values
 *
 * @param path - Path template with :param syntax (e.g., "/users/:id")
 * @param params - Object containing parameter values
 * @returns Path with parameters replaced
 *
 * @example
 * replacePath("/users/:id", { id: 123 }) // "/users/123"
 * replacePath("/users/:userId/posts/:postId", { userId: 1, postId: 2 }) // "/users/1/posts/2"
 */
function replacePath(
  path: string,
  params?: Record<string, string | number>
): string {
  if (!params) {
    return path;
  }

  let result = path;

  // Extract all parameter names from the path
  const paramNames = extractParamNames(path);

  // Validate all required parameters are provided
  for (const paramName of paramNames) {
    if (!(paramName in params)) {
      throw new Error(`Missing required path parameter: ${paramName}`);
    }

    // Replace :param with actual value
    result = result.replace(`:${paramName}`, String(params[paramName]));
  }

  return result;
}

/**
 * Extract parameter names from a path template
 *
 * @param path - Path template with :param syntax
 * @returns Array of parameter names
 *
 * @example
 * extractParamNames("/users/:id") // ["id"]
 * extractParamNames("/users/:userId/posts/:postId") // ["userId", "postId"]
 */
function extractParamNames(path: string): string[] {
  const matches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
  if (!matches) {
    return [];
  }
  return matches.map((match) => match.slice(1)); // Remove the leading ':'
}

/**
 * Build URL query string from query parameters object
 *
 * @param query - Query parameters object
 * @returns URL-encoded query string (without leading '?')
 *
 * @example
 * buildQueryString({ page: 1, search: "test" }) // "page=1&search=test"
 * buildQueryString({ tags: ["a", "b"] }) // "tags=a&tags=b"
 * buildQueryString({ name: "John Doe" }) // "name=John%20Doe"
 */
function buildQueryString(query: unknown): string {
  if (!query || typeof query !== "object") {
    return "";
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      // Handle arrays by adding multiple entries with the same key
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          params.append(key, String(item));
        }
      });
    } else if (typeof value === "object") {
      // Handle nested objects by JSON stringifying them
      params.append(key, JSON.stringify(value));
    } else {
      // Handle primitive values
      params.append(key, String(value));
    }
  }

  return params.toString();
}

/**
 * Parse response data, handling JSON and text responses
 *
 * @param response - Fetch Response object
 * @returns Parsed response data
 */
async function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  // Try to parse as JSON even if content-type is not set
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return undefined;
}

/**
 * Type guard to check if an error is an APIError
 *
 * @param error - Error to check
 * @returns True if error is an APIError
 */
function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "statusText" in error &&
    "message" in error
  );
}

/**
 * Type guard to check if an error is a ValidationError
 *
 * @param error - Error to check
 * @returns True if error is a ValidationError
 */
function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "validation" &&
    "errors" in error
  );
}
