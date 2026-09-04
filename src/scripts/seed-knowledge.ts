import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { developerKnowledgeRecords } from '../data/developer-knowledge.records.js'
import { upsertDeveloperKnowledge } from '../services/knowledge-base.service.js'

async function seedKnowledge() {
  await connectDatabase()
  const result = await upsertDeveloperKnowledge(developerKnowledgeRecords)
  console.log(
    `Knowledge records synced: ${result.upserted} added, ${result.modified} updated, ${result.matched} matched`
  )
}

void seedKnowledge()
  .catch((error) => {
    console.error('Failed to seed knowledge records', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
