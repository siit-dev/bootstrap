import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await Promise.all([
  fs.rm(path.join(rootDirectory, 'dist'), { force: true, recursive: true }),
  fs.rm(path.join(rootDirectory, 'js/dist'), { force: true, recursive: true })
])
