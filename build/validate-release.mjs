import fs from 'node:fs/promises'
import process from 'node:process'

const requestedVersion = process.argv[2]
const branch = process.argv[3] || process.env.GITHUB_REF_NAME
const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
const versionPattern = /^\d+\.\d+\.\d+-smartimpact\.[1-9]\d*$/

if (branch !== 'main') {
  throw new Error(`Releases must run from main, not ${branch || 'an unknown branch'}`)
}

if (!versionPattern.test(requestedVersion || '')) {
  throw new Error(`Invalid Smart Impact release version: ${requestedVersion || '(missing)'}`)
}

if (requestedVersion !== packageJson.version) {
  throw new Error(`Requested version ${requestedVersion} does not match package.json ${packageJson.version}`)
}

console.log(`Validated release ${requestedVersion} from main`)
