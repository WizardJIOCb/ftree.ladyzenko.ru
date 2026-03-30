import { pool } from '../db/index.js'
import { syncLadyzhenkoResearchTree, ladyzhenkoResearchPersons, ladyzhenkoResearchRelationships } from '../db/ladyzhenkoResearchData.js'

async function main() {
  await syncLadyzhenkoResearchTree()
  console.log(
    `Synced ladyzhenko-family: ${ladyzhenkoResearchPersons.length} persons, ${ladyzhenkoResearchRelationships.length} relationships`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
