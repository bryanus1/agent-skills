import { sign, verify } from '../../../lib/jwt'
import { User } from '../../../types/user'
import { db } from '../../../database/client'
import bcrypt from 'bcryptjs'
import { ApiError } from './errors'
import { SessionStore } from '../../../stores/session'
import { config } from '../../../config'
import { logger } from '../../utils/logger'
import jwt from 'jsonwebtoken'
import { RateLimiter } from '../../../middleware/rateLimiter'
import { sendEmail } from '../../services/email'
import { hashPassword, comparePassword } from '../helpers/crypto'

export async function login(email: string, password: string) {
  const user = await db.users.findByEmail(email)
  if (!user) throw new ApiError(401, 'Invalid credentials')

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) throw new ApiError(401, 'Invalid credentials')

  const token = sign({ userId: user.id }, config.jwtSecret)
  await SessionStore.create(user.id, token)
  logger.info(`User ${user.id} logged in`)
  return { token, user }
}

export async function logout(token: string) {
  const payload = verify(token, config.jwtSecret)
  await SessionStore.destroy(payload.userId)
}

export async function resetPassword(email: string) {
  const user = await db.users.findByEmail(email)
  if (!user) return
  await sendEmail(user.email, 'password-reset', { userId: user.id })
}
