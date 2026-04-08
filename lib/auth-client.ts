// Client-side auth utilities that don't require server modules
export async function logout() {
  // Clear local state - the actual logout logic is handled by the role context
  return { success: true }
}