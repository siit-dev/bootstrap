import fs from 'node:fs/promises'
import process from 'node:process'

const [metadataPath, expectedCommit] = process.argv.slice(2)

if (!metadataPath || !expectedCommit) {
  throw new Error('Usage: node build/validate-published-package.mjs <metadata.json> <git commit>')
}

const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
const repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url
const normalizedRepository = repository?.replace(/^git\+/, '').replace(/\.git$/, '')

if (normalizedRepository !== 'https://github.com/siit-dev/bootstrap') {
  throw new Error(`Published package repository does not match siit-dev/bootstrap: ${repository || '(missing)'}`)
}

if (metadata.gitHead !== expectedCommit) {
  throw new Error(`Published package gitHead ${metadata.gitHead || '(missing)'} does not match ${expectedCommit}`)
}

console.log(`Published package metadata matches ${expectedCommit}`)
