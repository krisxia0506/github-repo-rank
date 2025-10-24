/**
 * Helper to work around Supabase TypeScript inference issues
 * TypeScript narrowing with error checks causes the type to become 'never'
 */
export function assertData<T>(data: T | null, error: any): T {
  if (error || !data) {
    throw new Error(error?.message || 'Data not found')
  }
  return data
}

/**
 * Helper for optional data that might be null
 */
export function getData<T>(data: T | null): T | null {
  return data
}
