#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const [expectedPath, actualPath, diffPath] = process.argv.slice(2)

if (!expectedPath || !actualPath) {
  process.stderr.write('Usage: node build/compare-pixels.mjs <expected.png> <actual.png> [diff.png]\n')
  process.exit(2)
}

const expected = PNG.sync.read(fs.readFileSync(expectedPath))
const actual = PNG.sync.read(fs.readFileSync(actualPath))

if (expected.width !== actual.width || expected.height !== actual.height) {
  process.stderr.write(
    `Image dimensions differ: ${expected.width}x${expected.height} != ${actual.width}x${actual.height}\n`
  )
  process.exit(1)
}

const diff = new PNG({ width: expected.width, height: expected.height })
const differentPixels = pixelmatch(
  expected.data,
  actual.data,
  diff.data,
  expected.width,
  expected.height,
  { threshold: 0 }
)
const totalPixels = expected.width * expected.height

if (diffPath) {
  fs.mkdirSync(path.dirname(diffPath), { recursive: true })
  fs.writeFileSync(diffPath, PNG.sync.write(diff))
}

process.stdout.write(
  `${differentPixels}/${totalPixels} pixels differ ` +
  `(${(differentPixels * 100 / totalPixels).toFixed(8)}%).\n`
)

if (differentPixels !== 0) {
  process.exitCode = 1
}
