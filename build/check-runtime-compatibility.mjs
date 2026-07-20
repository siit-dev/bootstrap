#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import postcss from 'postcss'
import * as sass from 'sass'

const root = path.resolve(import.meta.dirname, '..')
const baselineRef = '6f20e52759a0e0dee2c2f171e9357f3ccca52992'
const cssFiles = [
  'bootstrap.css',
  'bootstrap-grid.css',
  'bootstrap-reboot.css',
  'bootstrap-utilities.css',
  'bootstrap.rtl.css'
]

function git(...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
}

function baselineFile(file) {
  return git('show', `${baselineRef}:${file}`)
}

function listBaselineFiles(directory) {
  return git('ls-tree', '-r', '--name-only', baselineRef, '--', directory)
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

function selectorInventory(css) {
  const selectors = new Set()
  const classes = new Set()

  postcss.parse(css).walkRules(rule => {
    for (const selector of rule.selectors || []) {
      const normalized = selector.replace(/\s+/g, ' ').trim()
      selectors.add(normalized)
      for (const match of normalized.matchAll(/\.(-?(?:\\.|[\w-])+)/g)) {
        classes.add(match[1])
      }
    }
  })

  return { selectors, classes }
}

function missingFrom(expected, actual) {
  return [...expected].filter(value => !actual.has(value)).sort()
}

function sassApiInventory(files) {
  const variables = new Set()
  const callables = new Map()
  const imports = new Map()

  for (const [file, source] of files) {
    for (const match of source.matchAll(/\$([a-z0-9_-]+)\s*:/gi)) {
      variables.add(match[1])
    }

    for (const match of source.matchAll(/@(function|mixin)\s+([a-z0-9_-]+)\s*(\([^)]*\))?/gi)) {
      const signature = `${match[1]} ${match[2]}${match[3] || ''}`.replace(/\s+/g, ' ')
      callables.set(`${match[1]}:${match[2]}`, signature)
    }

    if (/scss\/bootstrap[^/]*\.scss$/.test(file.replaceAll('\\', '/'))) {
      const entrypointImports = new Set()

      for (const match of source.matchAll(/@import\s+["']([^"']+)["']/g)) {
        entrypointImports.add(match[1])
      }

      imports.set(file.replaceAll('\\', '/'), entrypointImports)
    }
  }

  return { variables, callables, imports }
}

const failures = []

for (const name of cssFiles) {
  const currentPath = path.join(root, 'dist', 'css', name)
  const current = fs.readFileSync(currentPath, 'utf8')
  if (!current.includes('Bootstrap runtime configuration')) {
    failures.push(`${name}: runtime marker is missing; regenerate CSS distributions`)
    continue
  }

  const baseline = selectorInventory(baselineFile(`dist/css/${name}`))
  const runtime = selectorInventory(current)
  const missingSelectors = missingFrom(baseline.selectors, runtime.selectors)
  const addedSelectors = missingFrom(runtime.selectors, baseline.selectors)
  const missingClasses = missingFrom(baseline.classes, runtime.classes)
  const addedClasses = missingFrom(runtime.classes, baseline.classes)

  if (missingSelectors.length || addedSelectors.length || missingClasses.length || addedClasses.length) {
    failures.push(
      `${name}: selector/class inventory changed` +
      `\n  missing selectors: ${missingSelectors.slice(0, 10).join(', ') || 'none'}` +
      `\n  added selectors: ${addedSelectors.slice(0, 10).join(', ') || 'none'}` +
      `\n  missing classes: ${missingClasses.slice(0, 10).join(', ') || 'none'}` +
      `\n  added classes: ${addedClasses.slice(0, 10).join(', ') || 'none'}`
    )
  }
}

const baselineScssPaths = listBaselineFiles('scss').filter(file => file.endsWith('.scss'))
const baselineScss = baselineScssPaths.map(file => [file, baselineFile(file)])
const currentScss = walk(path.join(root, 'scss'))
  .filter(file => file.endsWith('.scss'))
  .map(file => [path.relative(root, file).replaceAll('\\', '/'), fs.readFileSync(file, 'utf8')])

const baselineApi = sassApiInventory(baselineScss)
const runtimeApi = sassApiInventory(currentScss)

for (const variable of missingFrom(baselineApi.variables, runtimeApi.variables)) {
  failures.push(`Sass variable removed: $${variable}`)
}

for (const [entrypoint, baselineImports] of baselineApi.imports) {
  const runtimeImports = runtimeApi.imports.get(entrypoint) || new Set()
  for (const importPath of missingFrom(baselineImports, runtimeImports)) {
    failures.push(`Sass entrypoint import removed from ${entrypoint}: ${importPath}`)
  }
}

for (const [key, signature] of baselineApi.callables) {
  if (!runtimeApi.callables.has(key)) {
    failures.push(`Sass callable removed: ${signature}`)
  } else if (runtimeApi.callables.get(key) !== signature) {
    failures.push(`Sass signature changed: ${signature} -> ${runtimeApi.callables.get(key)}`)
  }
}

for (const file of [
  ...listBaselineFiles('js/src'),
  ...listBaselineFiles('dist/js')
]) {
  const currentPath = path.join(root, file)
  if (!fs.existsSync(currentPath) || fs.readFileSync(currentPath, 'utf8') !== baselineFile(file)) {
    failures.push(`JavaScript artifact changed: ${file}`)
  }
}

const customPrimaryCss = sass.compileString(
  '$primary: #7654ff; $theme-colors: ("primary": $primary, "brand": #123456); @import "bootstrap";',
  {
    loadPaths: [path.join(root, 'scss')]
  }
).css
const customPrimaryRuntime = customPrimaryCss.split('/*! Bootstrap runtime configuration */')[1] || ''

if (
  !customPrimaryRuntime.includes('--bs-primary: #7654ff') ||
  customPrimaryRuntime.includes('--bs-primary: var(--bs-blue)') ||
  !customPrimaryCss.includes('--bs-brand: #123456') ||
  !customPrimaryRuntime.includes('.btn-brand')
) {
  failures.push('A custom Sass scalar or theme map key was not preserved by the runtime pass')
}

const postImportStateCss = sass.compileString(
  '@import "bootstrap"; .post-import-state {' +
  ' primary: $primary; spacer: $spacer; tinted: tint-color($primary, 20%);' +
  ' runtime-mode: $enable-runtime-values; }',
  {
    loadPaths: [path.join(root, 'scss')]
  }
).css

if (
  !postImportStateCss.includes('primary: #0d6efd') ||
  !postImportStateCss.includes('spacer: 1rem') ||
  !postImportStateCss.includes('tinted: #3d8bfd') ||
  !postImportStateCss.includes('runtime-mode: false')
) {
  failures.push('Public Sass globals were not restored after importing Bootstrap')
}

const customUtilityCss = sass.compileString(
  '@import "functions"; @import "variables"; @import "variables-dark";' +
  ' @import "maps"; @import "mixins"; @import "utilities";' +
  ' $utilities: map-merge($utilities, ("probe": (' +
  ' property: width, class: probe, values: (responsive: var(--bs-spacer)))));' +
  ' @import "root"; @import "utilities/api"; @import "runtime-utilities";' +
  ' @import "runtime"; @import "mixins"; @import "runtime-api";',
  {
    loadPaths: [path.join(root, 'scss')]
  }
).css

if (
  (customUtilityCss.match(/\.probe-responsive\s*\{/g) || []).length !== 2 ||
  !customUtilityCss.includes('width: var(--bs-spacer) !important')
) {
  failures.push('A custom utility addition or override was not preserved by the runtime pass')
}

const runtimeSource = fs.readFileSync(path.join(root, 'scss', '_runtime.scss'), 'utf8')
if (
  runtimeSource.includes('contrast-color(') ||
  /@supports[^{]+(?:color-mix|rgb\(from)/.test(runtimeSource)
) {
  failures.push('The runtime graph still depends on contrast-color() or a feature-query wrapper')
}

if (failures.length) {
  process.stderr.write(`Bootstrap 5.3.8 compatibility check failed:\n- ${failures.join('\n- ')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(
    `Bootstrap 5.3.8 compatibility preserved across ${cssFiles.length} CSS inventories, ` +
    `${baselineApi.variables.size} Sass variables, ${baselineApi.callables.size} callable signatures, and JavaScript artifacts.\n`
  )
}
