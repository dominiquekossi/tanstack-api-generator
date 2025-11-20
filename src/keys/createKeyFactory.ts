import type { APIConfig, EndpointConfig, ExtractParams } from "../types";

/**
 * Query key factory type that generates typed key functions for each endpoint
 *
 * Follows TanStack Query v5 hierarchical key standards:
 * - [group, endpoint] for endpoints without parameters
 * - [group, endpoint, params] for endpoints with parameters
 */
export type QueryKeyFactory<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: TConfig[Group] extends EndpointConfig
    ? {
        key: (
          params?: ExtractParams<TConfig[Group]["path"]>
        ) => readonly unknown[];
      }
    : TConfig[Group] extends Record<string, EndpointConfig>
    ? {
        [Endpoint in keyof TConfig[Group]]: {
          key: (
            params?: ExtractParams<TConfig[Group][Endpoint]["path"]>
          ) => readonly unknown[];
        };
      }
    : never;
};

/**
 * Creates a query key factory from API configuration
 *
 * Generates deterministic, hierarchical query keys following TanStack Query v5 standards.
 * Keys are structured as [group, endpoint, params] for consistent caching and invalidation.
 *
 * @param config - API configuration defining all endpoints
 * @returns Query key factory with typed key generation functions
 *
 * @example
 * ```typescript
 * const config = {
 *   users: {
 *     list: { method: 'GET', path: '/users' },
 *     get: { method: 'GET', path: '/users/:id' },
 *   }
 * } as const;
 *
 * const keys = createKeyFactory(config);
 *
 * keys.users.list.key(); // ['users', 'list']
 * keys.users.get.key({ id: '123' }); // ['users', 'get', { id: '123' }]
 * ```
 */
export function createKeyFactory<TConfig extends APIConfig>(
  config: TConfig
): QueryKeyFactory<TConfig> {
  const factory: any = {};

  // Iterate through each group in the configuration
  for (const group in config) {
    const groupConfig = config[group];

    // Check if this is a direct endpoint or a nested group
    if (isEndpointConfig(groupConfig)) {
      // Direct endpoint at group level
      factory[group] = {
        key: (params?: any) => createKey(group, group, params),
      };
    } else {
      // Nested group with multiple endpoints
      factory[group] = {};

      for (const endpoint in groupConfig) {
        factory[group][endpoint] = {
          key: (params?: any) => createKey(group, endpoint, params),
        };
      }
    }
  }

  return factory as QueryKeyFactory<TConfig>;
}

/**
 * Creates a hierarchical query key with deterministic parameter ordering
 *
 * @param group - The endpoint group name
 * @param endpoint - The endpoint name
 * @param params - Optional parameters to include in the key
 * @returns Readonly array representing the query key
 */
function createKey(
  group: string,
  endpoint: string,
  params?: Record<string, string | number>
): readonly unknown[] {
  const key: unknown[] = [group, endpoint];

  // If parameters are provided, add them to the key
  if (params && Object.keys(params).length > 0) {
    // Sort parameter keys for deterministic ordering
    const sortedParams: Record<string, string | number> = {};
    const keys = Object.keys(params).sort();

    for (const k of keys) {
      const value = params[k];
      if (value !== undefined) {
        sortedParams[k] = value;
      }
    }

    key.push(sortedParams);
  }

  return key as readonly unknown[];
}

/**
 * Type guard to check if a value is an EndpointConfig
 */
function isEndpointConfig(value: any): value is EndpointConfig {
  return (
    value &&
    typeof value === "object" &&
    "method" in value &&
    "path" in value &&
    typeof value.method === "string" &&
    typeof value.path === "string"
  );
}
