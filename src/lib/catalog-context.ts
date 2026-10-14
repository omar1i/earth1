import { getRouteApi } from '@tanstack/react-router';
import { staticCatalog, type Catalog } from './catalog';

const rootApi = getRouteApi('__root__');
let fallback: Catalog | undefined;

/** The catalog loaded by the root route (database content, or built-in content as fallback). */
export function useCatalog(): Catalog {
  const data = rootApi.useLoaderData() as unknown as { catalog?: Catalog } | undefined;
  return data?.catalog ?? (fallback ??= staticCatalog());
}
