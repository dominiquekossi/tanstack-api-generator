import type { QueryClient } from "@tanstack/query-core";
import type { APIConfig, EndpointConfig, ExtractParams } from "../types";
import type { QueryKeyFactory } from "../keys/createKeyFactory";

/**
 * Invalidation utilities type that provides manual invalidation methods
 * for each endpoint and group
 */
export type InvalidationUtils<TConfig extends APIConfig> = {
  [Group in keyof TConfig]: TConfig[Group] extends EndpointConfig
    ? {
        invalidate: (
          params?: ExtractParams<TConfig[Group]["path"]>
        ) => Promise<void>;
      }
    : TConfig[Group] extends Record<string, EndpointConfig>
    ? {
        invalidate: {
          all: () => Promise<void>;
        } & {
          [Endpoint in keyof TConfig[Group]]: (
            params?: ExtractParams<TConfig[Group][Endpoint]["path"]>
          ) => Promise<void>;
        };
      }
    : never;
};

/**
 * Creates invalidation utilities from API configuration
 *
 * Generates manual invalidation methods for each endpoint and group.
 * Supports invalidating specific queries by parameters or entire groups.
 *
 * @param config - API configuration defining all endpoints
 * @param queryClient - TanStack Query client instance for cache management
 * @param keyFactory - Query key factory for generating cache keys
 * @returns Invalidation utilities object matching the config structure
 *
 * @example
 * ```typescript
 * const invalidation = createInvalidation(config, queryClient, keyFactory);
 *
 * // Invalidate specific query
 * await invalidation.users.get({ id: '123' });
 *
 * // Invalidate all queries in a group
 * await invalidation.users.invalidate.all();
 * ```
 */
export function createInvalidation<TConfig extends APIConfig>(
  config: TConfig,
  queryClient: QueryClient,
  keyFactory: QueryKeyFactory<TConfig>
): InvalidationUtils<TConfig> {
  const invalidation: any = {};

  // Iterate through each group in the configuration
  for (const group in config) {
    const groupConfig = config[group];

    // Check if this is a direct endpoint or a nested group
    if (isEndpointConfig(groupConfig)) {
      // Direct endpoint at group level
      const keyFn = (keyFactory as any)[group].key;

      invalidation[group] = {
        invalidate: async (params?: any) => {
          const queryKey = keyFn(params);
          await queryClient.invalidateQueries({ queryKey });
        },
      };
    } else {
      // Nested group with multiple endpoints
      invalidation[group] = {
        invalidate: {
          // Create invalidate.all() for the entire group
          all: async () => {
            await queryClient.invalidateQueries({
              queryKey: [group],
            });
          },
        },
      };

      // Create invalidate method for each endpoint
      for (const endpointName in groupConfig) {
        const keyFn = (keyFactory as any)[group][endpointName].key;

        invalidation[group].invalidate[endpointName] = async (params?: any) => {
          const queryKey = keyFn(params);
          await queryClient.invalidateQueries({ queryKey });
        };
      }
    }
  }

  return invalidation as InvalidationUtils<TConfig>;
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
