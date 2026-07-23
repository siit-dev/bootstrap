import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const version = process.argv[2]
const versionPattern = /^\d+\.\d+\.\d+-smartimpact\.[1-9]\d*$/

if (!versionPattern.test(version || '')) {
  throw new Error('Usage: npm run release-version -- <base>-smartimpact.<positive integer>')
}

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function updateJson(relativePath, update) {
  const filePath = path.join(rootDirectory, relativePath)
  const json = JSON.parse(await fs.readFile(filePath, 'utf8'))

  update(json)
  await fs.writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`)
}

await updateJson('package.json', packageJson => {
  packageJson.version = version
})

await updateJson('package-lock.json', packageLock => {
  packageLock.version = version
  packageLock.packages[''].version = version
})

console.log(`Updated package.json and package-lock.json to ${version}`)
