import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { UserModel } from '../models/user.model.js'
import { hashPassword } from '../services/auth.service.js'

async function seedAdmin() {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required')
  }

  await connectDatabase()

  const email = env.SEED_ADMIN_EMAIL.toLowerCase()
  const existingAdmin = await UserModel.findOne({ email }).exec()

  if (existingAdmin) {
    console.log(`Admin already exists: ${email}`)
    return
  }

  await UserModel.create({
    fullName: env.SEED_ADMIN_NAME,
    email,
    role: 'admin',
    passwordHash: hashPassword(env.SEED_ADMIN_PASSWORD),
    isActive: true,
    mustChangePassword: true,
  })

  console.log(`Seeded admin: ${email}`)
}

void seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
