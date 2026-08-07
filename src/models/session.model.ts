import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

export interface Session {
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  revokedAt?: Date
  lastUsedAt: Date
}

export type SessionDocument = HydratedDocument<Session>

const sessionSchema = new Schema<Session>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    lastUsedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
)

export const SessionModel = model<Session>('Session', sessionSchema)
