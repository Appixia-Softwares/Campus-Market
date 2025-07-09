// Remove all supabase imports and usage. Replace with Firebase equivalents or remove.

export async function getUserInterests(userId: string) {
  try {
    // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
    return []
  } catch (error) {
    console.error("Error fetching user interests:", error)
    return []
  }
}

export async function addUserInterest(interest: Partial<UserInterest>) {
  try {
    // Check if interest already exists
    // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
    return {} as UserInterest
  } catch (error) {
    console.error("Error adding user interest:", error)
    throw error
  }
}

export async function removeUserInterest(id: string | number) {
  try {
    // Remove all supabase imports and usage. Replace with Firebase equivalents or remove.
    return true
  } catch (error) {
    console.error("Error removing user interest:", error)
    throw error
  }
}
