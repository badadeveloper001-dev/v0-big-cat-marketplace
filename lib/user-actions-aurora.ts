'use server'

import { query } from '@/lib/db'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

interface UserResponse {
  success: boolean
  error?: string
  data?: any
}

export async function getUserProfile(userId: string): Promise<UserResponse> {
  try {
    const { rows } = await query('SELECT * FROM auth_users WHERE id = $1', [userId])
    if (rows.length === 0) {
      return { success: false, error: 'User not found' }
    }
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to fetch profile' }
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Record<string, any>
): Promise<UserResponse> {
  try {
    const fields = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')

    const values = [userId, ...Object.values(updates)]

    const { rows } = await query(
      `UPDATE auth_users SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )

    revalidatePath('/')
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function deleteUserAccount(userId: string): Promise<UserResponse> {
  try {
    await query('UPDATE auth_users SET deleted_at = NOW() WHERE id = $1', [userId])
    revalidatePath('/')
    return { success: true, data: { message: 'Account deleted successfully' } }
  } catch {
    return { success: false, error: 'Failed to delete account' }
  }
}
