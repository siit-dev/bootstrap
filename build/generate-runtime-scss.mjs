#!/usr/bin/env node

/**
 * Generate scss/_runtime.scss from Bootstrap's public scalar !default
 * variables. The generated layer is imported after _root.scss:
 *
 * 1. Bootstrap's original Sass values remain the progressive fallback.
 * 2. Modern custom-property values reference their upstream tokens.
 * 3. Component compilation sees var() references instead of copied values.
 *
 * Maps, feature flags, breakpoints, selectors, and encoded SVGs deliberately
 * remain structural Sass.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const sourceFiles = [
  path.join(rootDir, 'scss', '_variables.scss'),
  path.join(rootDir, 'scss', '_variables-dark.scss')
]
const destination = path.join(rootDir, 'scss', '_runtime.scss')
const restoreDestination = path.join(rootDir, 'scss', '_runtime-restore.scss')

const publicAliases = new Map([
  ['white', 'white'],
  ['black', 'black'],
  ['gray-100', 'gray-100'],
  ['gray-200', 'gray-200'],
  ['gray-300', 'gray-300'],
  ['gray-400', 'gray-400'],
  ['gray-500', 'gray-500'],
  ['gray-600', 'gray-600'],
  ['gray-700', 'gray-700'],
  ['gray-800', 'gray-800'],
  ['gray-900', 'gray-900'],
  ['blue', 'blue'],
  ['indigo', 'indigo'],
  ['purple', 'purple'],
  ['pink', 'pink'],
  ['red', 'red'],
  ['orange', 'orange'],
  ['yellow', 'yellow'],
  ['green', 'green'],
  ['teal', 'teal'],
  ['cyan', 'cyan'],
  ['primary', 'primary'],
  ['secondary', 'secondary'],
  ['success', 'success'],
  ['info', 'info'],
  ['warning', 'warning'],
  ['danger', 'danger'],
  ['light', 'light'],
  ['dark', 'dark'],
  ['primary-text-emphasis', 'primary-text-emphasis'],
  ['secondary-text-emphasis', 'secondary-text-emphasis'],
  ['success-text-emphasis', 'success-text-emphasis'],
  ['info-text-emphasis', 'info-text-emphasis'],
  ['warning-text-emphasis', 'warning-text-emphasis'],
  ['danger-text-emphasis', 'danger-text-emphasis'],
  ['light-text-emphasis', 'light-text-emphasis'],
  ['dark-text-emphasis', 'dark-text-emphasis'],
  ['primary-bg-subtle', 'primary-bg-subtle'],
  ['secondary-bg-subtle', 'secondary-bg-subtle'],
  ['success-bg-subtle', 'success-bg-subtle'],
  ['info-bg-subtle', 'info-bg-subtle'],
  ['warning-bg-subtle', 'warning-bg-subtle'],
  ['danger-bg-subtle', 'danger-bg-subtle'],
  ['light-bg-subtle', 'light-bg-subtle'],
  ['dark-bg-subtle', 'dark-bg-subtle'],
  ['primary-border-subtle', 'primary-border-subtle'],
  ['secondary-border-subtle', 'secondary-border-subtle'],
  ['success-border-subtle', 'success-border-subtle'],
  ['info-border-subtle', 'info-border-subtle'],
  ['warning-border-subtle', 'warning-border-subtle'],
  ['danger-border-subtle', 'danger-border-subtle'],
  ['light-border-subtle', 'light-border-subtle'],
  ['dark-border-subtle', 'dark-border-subtle'],
  ['font-family-sans-serif', 'font-sans-serif'],
  ['font-family-monospace', 'font-monospace'],
  ['font-size-root', 'root-font-size'],
  ['font-family-base', 'body-font-family'],
  ['font-size-base', 'body-font-size'],
  ['font-weight-base', 'body-font-weight'],
  ['line-height-base', 'body-line-height'],
  ['body-text-align', 'body-text-align'],
  ['body-color', 'body-color'],
  ['body-bg', 'body-bg'],
  ['body-emphasis-color', 'emphasis-color'],
  ['body-secondary-color', 'secondary-color'],
  ['body-secondary-bg', 'secondary-bg'],
  ['body-tertiary-color', 'tertiary-color'],
  ['body-tertiary-bg', 'tertiary-bg'],
  ['headings-color', 'heading-color'],
  ['link-color', 'link-color'],
  ['link-decoration', 'link-decoration'],
  ['link-hover-color', 'link-hover-color'],
  ['link-hover-decoration', 'link-hover-decoration'],
  ['code-color', 'code-color'],
  ['mark-color', 'highlight-color'],
  ['mark-bg', 'highlight-bg'],
  ['border-width', 'border-width'],
  ['border-style', 'border-style'],
  ['border-color', 'border-color'],
  ['border-color-translucent', 'border-color-translucent'],
  ['border-radius', 'border-radius'],
  ['border-radius-sm', 'border-radius-sm'],
  ['border-radius-lg', 'border-radius-lg'],
  ['border-radius-xl', 'border-radius-xl'],
  ['border-radius-xxl', 'border-radius-xxl'],
  ['border-radius-2xl', 'border-radius-2xl'],
  ['border-radius-pill', 'border-radius-pill'],
  ['box-shadow', 'box-shadow'],
  ['box-shadow-sm', 'box-shadow-sm'],
  ['box-shadow-lg', 'box-shadow-lg'],
  ['box-shadow-inset', 'box-shadow-inset'],
  ['focus-ring-width', 'focus-ring-width'],
  ['focus-ring-opacity', 'focus-ring-opacity'],
  ['focus-ring-color', 'focus-ring-color'],
  ['form-valid-color', 'form-valid-color'],
  ['form-valid-border-color', 'form-valid-border-color'],
  ['form-invalid-color', 'form-invalid-color'],
  ['form-invalid-border-color', 'form-invalid-border-color'],
  ['gradient', 'gradient'],
  ['spacer', 'spacer'],
  ['grid-gutter-width', 'gutter-width'],
  ['component-active-color', 'component-active-color'],
  ['component-active-bg', 'component-active-bg'],
  ['min-contrast-ratio', 'min-contrast-ratio']
])

const darkNames = new Set()
const declarations = new Map()

function stripLineComments(value) {
  let quote = null
  for (let index = 0; index < value.length - 1; index++) {
    const character = value[index]
    if (quote) {
      if (character === '\\') {
        index++
      } else if (character === quote) {
        quote = null
      }

      continue
    }

    if (character === '"' || character === '\'') {
      quote = character
      continue
    }

    if (character === '/' && value[index + 1] === '/') {
      return value.slice(0, index).trim()
    }
  }

  return value.trim()
}

// The parser tracks strings, interpolation, parentheses, and top-level Sass
// scope in one pass so multiline declarations are not split incorrectly.
// eslint-disable-next-line complexity
function collectDeclarations(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const isDark = filePath.endsWith('_variables-dark.scss')
  let braceDepth = 0
  let index = 0

  while (index < source.length) {
    const character = source[index]
    if (character === '{') {
      braceDepth++
      index++
      continue
    }

    if (character === '}') {
      braceDepth--
      index++
      continue
    }

    if (braceDepth !== 0 || character !== '$') {
      index++
      continue
    }

    const nameMatch = source.slice(index).match(/^\$([a-z0-9_-]+)\s*:/i)
    if (!nameMatch) {
      index++
      continue
    }

    const name = nameMatch[1]
    const valueStart = index + nameMatch[0].length
    let cursor = valueStart
    let parentheses = 0
    let quote = null
    let interpolation = 0

    while (cursor < source.length) {
      const current = source[cursor]
      if (quote) {
        if (current === '\\') {
          cursor += 2
          continue
        }

        if (current === quote) {
          quote = null
        }
      } else if (current === '"' || current === '\'') {
        quote = current
      } else if (current === '#' && source[cursor + 1] === '{') {
        interpolation++
        cursor++
      } else if (current === '}' && interpolation > 0) {
        interpolation--
      } else if (current === '(') {
        parentheses++
      } else if (current === ')') {
        parentheses--
      } else if (current === ';' && parentheses === 0 && interpolation === 0) {
        break
      }

      cursor++
    }

    const fullValue = stripLineComments(source.slice(valueStart, cursor))
    const defaultIndex = fullValue.lastIndexOf('!default')
    if (defaultIndex !== -1) {
      const expression = fullValue.slice(0, defaultIndex).trim()
      declarations.set(name, { expression, isDark })
      if (isDark) {
        darkNames.add(name)
      }
    }

    index = cursor + 1
  }
}

for (const sourceFile of sourceFiles) {
  collectDeclarations(sourceFile)
}

// Dark-mode Sass variables override the corresponding public root node rather
// than creating a disconnected `-dark` token.
for (const name of darkNames) {
  const lightName = name.endsWith('-dark') ? name.slice(0, -5) : null
  if (lightName && publicAliases.has(lightName)) {
    publicAliases.set(name, publicAliases.get(lightName))
  }
}

const structuralNames = new Set([
  'variable-prefix',
  'prefix',
  'color-mode-type',
  'body-text-align',
  'font-size-root',
  'link-hover-decoration',
  'headings-color',
  'headings-color-dark',
  'stretched-link-pseudo-element',
  'stretched-link-z-index',
  'grid-columns',
  'grid-row-columns',
  'zindex-dropdown',
  'zindex-sticky',
  'zindex-fixed',
  'zindex-offcanvas-backdrop',
  'zindex-offcanvas',
  'zindex-modal-backdrop',
  'zindex-modal',
  'zindex-popover',
  'zindex-tooltip',
  'zindex-toast',
  'form-check-label-cursor',
  'btn-white-space',
  'pagination-focus-outline',
  'table-cell-vertical-align',
  'table-th-font-weight'
])

// Values that participate in selector generation, at-rules, or Sass control
// flow must stay concrete even when their eventual CSS declarations are
// runtime-driven.
function collectStructuralUsage(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'tests' && entry.name !== 'vendor') {
        collectStructuralUsage(target)
      }

      continue
    }

    if (!entry.name.endsWith('.scss') || entry.name === '_runtime.scss') {
      continue
    }

    const lines = fs.readFileSync(target, 'utf8').split(/\r?\n/)
    for (const line of lines) {
      // A declaration can contain interpolation (for example a CSS custom
      // property reference), but neither its left-hand variable nor its
      // dependencies are structural merely because the line contains `{`.
      if (
        /^\s*\$[a-z0-9_-]+\s*:/i.test(line) ||
        /^\s*@(mixin|function|include)\b/i.test(line)
      ) {
        continue
      }

      const selectorOrDirective =
        (line.includes('{') && !/^\s*(?:--|[a-z-]+\s*:)/i.test(line)) ||
        /^\s*@(if|else\s+if|each|for|while|media|supports|at-root)\b/.test(line)
      if (!selectorOrDirective) {
        continue
      }

      for (const match of line.matchAll(/\$([a-z0-9_-]+)/gi)) {
        structuralNames.add(match[1])
      }
    }
  }
}

collectStructuralUsage(path.join(rootDir, 'scss'))

const excludedFunctions = /\b(?:if|map-get|map-merge|map-loop|nth|append|join|inspect|unquote|escape-svg|url)\s*\(/
const scalarCandidates = new Map()

for (const [name, declaration] of declarations) {
  const { expression } = declaration
  if (
    name.startsWith('enable-') ||
    structuralNames.has(name) ||
    expression === 'null' ||
    expression === 'true' ||
    expression === 'false' ||
    expression.startsWith('(') ||
    expression.includes('data:image/svg+xml') ||
    excludedFunctions.test(expression)
  ) {
    continue
  }

  scalarCandidates.set(name, declaration)
}

function splitArguments(value) {
  const argumentsList = []
  let current = ''
  let depth = 0
  let quote = null
  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    if (quote) {
      current += character
      if (character === '\\') {
        current += value[++index] || ''
      } else if (character === quote) {
        quote = null
      }

      continue
    }

    switch (character) {
      case '"':
      case '\'': {
        quote = character
        current += character

        break
      }

      case '(': {
        depth++
        current += character

        break
      }

      case ')': {
        depth--
        current += character

        break
      }

      default: { if (character === ',' && depth === 0) {
        argumentsList.push(current.trim())
        current = ''
      } else {
        current += character
      }
      }
    }
  }

  argumentsList.push(current.trim())
  return argumentsList
}

function replaceFunction(value, functionName, converter) {
  const needle = `${functionName}(`
  let result = value
  const findStart = string => {
    let position = string.lastIndexOf(needle)
    while (position !== -1 && position > 0 && /[a-z0-9_-]/i.test(string[position - 1])) {
      position = string.lastIndexOf(needle, position - 1)
    }

    return position
  }

  let start = findStart(result)

  while (start !== -1) {
    let depth = 1
    let quote = null
    let cursor = start + needle.length
    for (; cursor < result.length; cursor++) {
      const character = result[cursor]
      if (quote) {
        if (character === '\\') {
          cursor++
        } else if (character === quote) {
          quote = null
        }

        continue
      }

      switch (character) {
        case '"': {
          quote = character
          break
        }

        case '\'': {
          quote = character
          break
        }

        case '(': {
          depth++
          break
        }

        case ')': {
          depth--
          break
        }

        default: {
          break
        }
      }

      if (depth === 0) {
        break
      }
    }

    if (depth !== 0) {
      break
    }

    const inner = result.slice(start + needle.length, cursor)
    result = result.slice(0, start) + converter(splitArguments(inner)) + result.slice(cursor + 1)
    start = findStart(result)
  }

  return result
}

function varReference(name) {
  const publicName = publicAliases.get(name)
  return publicName ?
    `var(--#{$prefix}${publicName})` :
    (scalarCandidates.has(name) ?
      `var(--#{$prefix}config-${name})` :
      `#{$${name}}`)
}

function roundedColorMix(first, second, weight = '50%') {
  return `rgb(from color-mix(in srgb, ${first} ${weight}, ${second}) round(calc(r + .01)) round(calc(g + .01)) round(calc(b + .01)) / alpha)`
}

function convertFunctions(expression) {
  let value = expression
  value = replaceFunction(value, 'rgba', ([color, alpha = '1']) => `rgb(from ${color} r g b / ${alpha})`)
  value = replaceFunction(value, 'RGBA', ([color, alpha = '1']) => `rgb(from ${color} r g b / ${alpha})`)
  value = replaceFunction(value, 'tint-color', ([color, weight]) => roundedColorMix('white', color, weight))
  value = replaceFunction(value, 'shade-color', ([color, weight]) => roundedColorMix('black', color, weight))
  value = replaceFunction(value, 'shift-color', ([color, weight]) => {
    const trimmedWeight = weight.trim()
    if (trimmedWeight.startsWith('-')) {
      return roundedColorMix('white', color, trimmedWeight.slice(1))
    }

    return roundedColorMix('black', color, trimmedWeight)
  })
  value = replaceFunction(value, 'mix', ([first, second, weight = '50%']) => roundedColorMix(first, second, weight))
  value = replaceFunction(value, 'quote', ([string]) => string)
  value = replaceFunction(value, 'color-contrast', ([color]) => {
    const ratio = 'var(--#{$prefix}min-contrast-ratio)'
    const threshold = `calc(1.05 / ${ratio} - .05)`
    const lightSwitch = `clamp(0, calc((${threshold} - y + .0000001) * 10000000), 1)`
    return `color(from ${color} xyz-d65 calc(${lightSwitch} * .9504559271) ${lightSwitch} calc(${lightSwitch} * 1.0890577508))`
  })
  value = replaceFunction(value, 'add', ([first, second]) => `calc(${first} + ${second})`)
  value = replaceFunction(value, 'subtract', ([first, second]) => `calc(${first} - ${second})`)
  value = replaceFunction(value, 'divide', ([first, second]) => `calc(${first} / ${second})`)
  value = replaceFunction(value, 'to-rgb', ([color]) => `rgb(from ${color} r g b)`)
  return value
}

function convertExpression(expression) {
  const interpolations = []
  let converted = expression
    .replace(/#\{\$([a-z0-9_-]+)\}/gi, (_, name) => {
      const placeholder = `___BS_RUNTIME_INTERPOLATION_${interpolations.length}___`
      interpolations.push(varReference(name))
      return placeholder
    })
    .replace(/\$([a-z0-9_-]+)/gi, (_, name) => varReference(name))
    .replace(/___BS_RUNTIME_INTERPOLATION_(\d+)___/g, (_, index) => interpolations[Number(index)])

  converted = convertFunctions(converted)

  // Wrap scalar arithmetic. Multi-part values (shadows, transitions, etc.)
  // keep their token structure and only wrap their simple arithmetic runs.
  const mathGrammar = /^(?:var\([^)]*\)|#\{\$[^}]+\}|[-+]?(?:\d*\.)?\d+(?:[a-z%]+)?|calc\([^)]*\)|[()+\-*/]|\s)+$/i
  if (!converted.startsWith('calc(') && /[+*/]|\s-\s/.test(converted) && mathGrammar.test(converted)) {
    converted = `calc(${converted})`
  }

  converted = converted.replace(
    /(var\([^)]*\)|#\{\$[^}]+\})\s*([*/])\s*(-?(?:\d*\.)?\d+(?:[a-z%]+)?)/gi,
    'calc($1 $2 $3)'
  )
  converted = converted.replace(
    /(-?(?:\d*\.)?\d+(?:[a-z%]+)?)\s*([*/])\s*(var\([^)]*\)|#\{\$[^}]+\})/gi,
    'calc($1 $2 $3)'
  )

  return converted
}

const lightCandidates = [...scalarCandidates].filter(([, value]) => !value.isDark)
const darkCandidates = [...scalarCandidates].filter(([, value]) => value.isDark)
const runtimeLightCandidates = lightCandidates.map(entry => [...entry, convertExpression(entry[1].expression)])
const runtimeDarkCandidates = darkCandidates.map(entry => [...entry, convertExpression(entry[1].expression)])
const runtimeModeCandidates = runtimeLightCandidates.filter(([name]) => !publicAliases.has(name))

// Emit `#{...}` without dropping the quotes of quoted Sass strings, so an
// override like `$breadcrumb-divider: quote(">")` survives the fallback path.
function interpolation(name) {
  return `#{if(type-of($${name}) == "string", inspect($${name}), $${name})}`
}

function declarationLines(entries, fallback = false, indentation = 4) {
  return entries.map(([name, declaration, converted]) => {
    const indent = ' '.repeat(indentation)
    const property = publicAliases.get(name) || `config-${name}`

    if (fallback) {
      return `${indent}--#{$prefix}${property}: ${interpolation(name)};`
    }

    const childIndent = ' '.repeat(indentation + 2)

    // Both comparison operands are parenthesized: `==` binds tighter than
    // space- or comma-list construction in SassScript, so an unparenthesized
    // `@if $x == 0 .5rem 1rem red` would parse as the always-truthy list
    // `(($x == 0) .5rem 1rem red)` and silently revert list-valued overrides.
    return [
      `${indent}@if ($${name}) == (${declaration.expression}) {`,
      `${childIndent}--#{$prefix}${property}: ${converted};`,
      `${indent}} @else {`,
      `${childIndent}--#{$prefix}${property}: ${interpolation(name)};`,
      `${indent}}`
    ].join('\n')
  })
}

function reassignmentLines(entries) {
  return entries.map(([name]) => {
    const property = publicAliases.get(name) || `config-${name}`
    return `$${name}: var(--#{$prefix}${property});`
  })
}

function snapshotLines(entries) {
  return entries.map(([name]) => `$runtime-config-fallback-${name}: $${name};`)
}

function restoreLines(entries) {
  return entries.map(([name]) => `$${name}: $runtime-config-fallback-${name} !global;`)
}

const runtimeMapNames = [
  'theme-colors',
  'theme-colors-rgb',
  'table-variants',
  'utilities-colors',
  'utilities-text',
  'utilities-text-colors',
  'utilities-bg',
  'utilities-bg-colors',
  'utilities-border',
  'utilities-border-colors',
  'utilities-links-underline',
  'form-validation-states',
  'font-sizes',
  'display-font-sizes',
  'container-max-widths',
  'spacers',
  'gutters',
  'negative-spacers'
]

const defaultFontSizes = [
  '  1: $h1-font-size,',
  '  2: $h2-font-size,',
  '  3: $h3-font-size,',
  '  4: $h4-font-size,',
  '  5: $h5-font-size,',
  '  6: $h6-font-size'
]

const output = [
  '// THIS FILE IS GENERATED BY build/generate-runtime-scss.mjs.',
  '// Edit _variables.scss/_variables-dark.scss or the generator, then run:',
  '// npm run css-runtime-generate',
  '',
  '// The quote-preserving if()/inspect() interpolation below is intentional;',
  '// the linter cannot see through the wrapper to the interpolated variable.',
  '// stylelint-disable scss/dollar-variable-no-missing-interpolation',
  '',
  '/*! Bootstrap runtime configuration */',
  '// Progressive fallback tokens: exact Bootstrap 5.3.8 Sass values.',
  ':root,',
  '[data-bs-theme="light"] {',
  ...declarationLines(lightCandidates, true),
  '    --#{$prefix}rfs-base-value: #{if($rfs-unit == rem, divide($rfs-base-value, $rfs-rem-value) * 1rem, $rfs-base-value * 1px)};',
  '    --#{$prefix}rfs-factor: #{$rfs-factor};',
  '    --#{$prefix}rfs-breakpoint: #{$rfs-mq-value};',
  '    --#{$prefix}min-contrast-ratio: #{$min-contrast-ratio};',
  '    @each $display, $value in $display-font-sizes {',
  '      --#{$prefix}config-display-#{$display}-font-size: #{$value};',
  '    }',
  '    @each $size, $value in $font-sizes {',
  '      --#{$prefix}config-font-size-#{$size}: #{$value};',
  '    }',
  '    @each $breakpoint, $value in $container-max-widths {',
  '      --#{$prefix}config-container-max-width-#{$breakpoint}: #{$value};',
  '    }',
  '    @each $key, $value in $spacers {',
  '      --#{$prefix}config-spacer-#{$key}: #{$value};',
  '    }',
  '    @each $key, $value in $gutters {',
  '      --#{$prefix}config-gutter-#{$key}: #{$value};',
  '    }',
  '}',
  '',
  '@if $enable-dark-mode {',
  '  @include color-mode(dark, true) {',
  ...declarationLines(darkCandidates, true).map(line => `  ${line}`),
  '  }',
  '}',
  '',
  '// Reactive dependency graph. This build targets browsers with custom',
  '// properties, color-mix(), relative colors, and native CSS math.',
  '// The feature query gates the whole reactive layer: without it, a browser',
  '// with partial support would let these custom-property declarations win the',
  '// cascade and then fail substitution at computed-value time, unsetting',
  '// properties instead of reviving the fallback tokens above.',
  '@supports #{$runtime-values-feature-query} {',
  ':root,',
  '[data-bs-theme="light"] {',
  ...declarationLines(runtimeLightCandidates),
  '',
  '    @if $font-sizes == (',
  ...defaultFontSizes.map(line => `    ${line}`),
  '    ) {',
  '      --#{$prefix}config-font-size-1: var(--#{$prefix}config-h1-font-size);',
  '      --#{$prefix}config-font-size-2: var(--#{$prefix}config-h2-font-size);',
  '      --#{$prefix}config-font-size-3: var(--#{$prefix}config-h3-font-size);',
  '      --#{$prefix}config-font-size-4: var(--#{$prefix}config-h4-font-size);',
  '      --#{$prefix}config-font-size-5: var(--#{$prefix}config-h5-font-size);',
  '      --#{$prefix}config-font-size-6: var(--#{$prefix}config-h6-font-size);',
  '    }',
  '',
  '  // Bootstrap 5 keeps channel lists in the fallback declarations above.',
  '  // Runtime declarations use colors so alpha is applied with relative rgb().',
  '  @each $color, $value in $theme-colors {',
  '    --#{$prefix}#{$color}-rgb: rgb(from var(--#{$prefix}#{$color}) r g b);',
  '  }',
  '  --#{$prefix}white-rgb: rgb(from var(--#{$prefix}white) r g b);',
  '  --#{$prefix}black-rgb: rgb(from var(--#{$prefix}black) r g b);',
  '  --#{$prefix}body-color-rgb: rgb(from var(--#{$prefix}body-color) r g b);',
  '  --#{$prefix}body-bg-rgb: rgb(from var(--#{$prefix}body-bg) r g b);',
  '  --#{$prefix}emphasis-color-rgb: rgb(from var(--#{$prefix}emphasis-color) r g b);',
  '  --#{$prefix}secondary-color-rgb: rgb(from var(--#{$prefix}secondary-color) r g b);',
  '  --#{$prefix}secondary-bg-rgb: rgb(from var(--#{$prefix}secondary-bg) r g b);',
  '  --#{$prefix}tertiary-color-rgb: rgb(from var(--#{$prefix}tertiary-color) r g b);',
  '  --#{$prefix}tertiary-bg-rgb: rgb(from var(--#{$prefix}tertiary-bg) r g b);',
  '  --#{$prefix}link-color-rgb: rgb(from var(--#{$prefix}link-color) r g b);',
  '  --#{$prefix}link-hover-color-rgb: rgb(from var(--#{$prefix}link-hover-color) r g b);',
  '}',
  '',
  '@if $enable-dark-mode {',
  '  @include color-mode(dark, true) {',
  ...declarationLines(runtimeModeCandidates, false, 4),
  ...declarationLines(runtimeDarkCandidates, false, 4),
  '    --#{$prefix}body-color-rgb: rgb(from var(--#{$prefix}body-color) r g b);',
  '    --#{$prefix}body-bg-rgb: rgb(from var(--#{$prefix}body-bg) r g b);',
  '    --#{$prefix}emphasis-color-rgb: rgb(from var(--#{$prefix}emphasis-color) r g b);',
  '    --#{$prefix}secondary-color-rgb: rgb(from var(--#{$prefix}secondary-color) r g b);',
  '    --#{$prefix}secondary-bg-rgb: rgb(from var(--#{$prefix}secondary-bg) r g b);',
  '    --#{$prefix}tertiary-color-rgb: rgb(from var(--#{$prefix}tertiary-color) r g b);',
  '    --#{$prefix}tertiary-bg-rgb: rgb(from var(--#{$prefix}tertiary-bg) r g b);',
  '    --#{$prefix}link-color-rgb: rgb(from var(--#{$prefix}link-color) r g b);',
  '    --#{$prefix}link-hover-color-rgb: rgb(from var(--#{$prefix}link-hover-color) r g b);',
  '  }',
  '}',
  '}',
  '',
  '// Components compiled after this file consume the runtime graph.',
  '$runtime-enable-runtime-values-fallback: $enable-runtime-values;',
  ...snapshotLines([...lightCandidates, ...darkCandidates]),
  ...runtimeMapNames.map(name => `$runtime-map-fallback-${name}: $${name};`),
  '',
  '$runtime-table-bg-scale-is-negative: $table-bg-scale < 0;',
  '// Literal contrast candidates, captured before reassignment so the stock',
  '// color-contrast() algorithm keeps working for literal backgrounds (for',
  '// example a consumer-customized $table-variants entry) in the second pass.',
  '$runtime-literal-color-contrast-light: $color-contrast-light;',
  '$runtime-literal-color-contrast-dark: $color-contrast-dark;',
  '$runtime-literal-white: $white;',
  '$runtime-literal-black: $black;',
  '// Stock focus-shadow expressions, captured before reassignment so the',
  '// validation-state guards can detect consumer overrides.',
  '$runtime-stock-focus-shadows: (',
  '  "valid": 0 0 $input-btn-focus-blur $input-focus-width rgba(var(--#{$prefix}success-rgb), $input-btn-focus-color-opacity),',
  '  "invalid": 0 0 $input-btn-focus-blur $input-focus-width rgba(var(--#{$prefix}danger-rgb), $input-btn-focus-color-opacity)',
  ');',
  '$runtime-display-font-sizes-fallback: $display-font-sizes;',
  '$runtime-font-sizes-fallback: $font-sizes;',
  '$runtime-container-max-widths-fallback: $container-max-widths;',
  '$runtime-spacers-fallback: $spacers;',
  '$runtime-gutters-fallback: $gutters;',
  '$enable-runtime-values: true !global;',
  ...reassignmentLines(lightCandidates),
  ...reassignmentLines(darkCandidates),
  '',
  '// Runtime map values preserve keys and class generation.',
  '$runtime-theme-colors: ();',
  '@each $color, $value in $theme-colors {',
  '  $runtime-theme-colors: map-merge(',
  '    $runtime-theme-colors,',
  '    ($color: var(--#{$prefix}#{$color}, #{$value}))',
  '  );',
  '}',
  '$theme-colors: $runtime-theme-colors;',
  '$theme-colors-rgb: $theme-colors;',
  '// Runtime table variants apply per entry, and only where the consumer kept',
  '// the stock derivation; customized entries keep their compiled value.',
  '@each $runtime-key, $runtime-source in ("primary": $primary, "secondary": $secondary, "success": $success, "info": $info, "warning": $warning, "danger": $danger) {',
  '  @if map-get($runtime-map-fallback-table-variants, $runtime-key) == shift-color(map-get(("primary": $runtime-config-fallback-primary, "secondary": $runtime-config-fallback-secondary, "success": $runtime-config-fallback-success, "info": $runtime-config-fallback-info, "warning": $runtime-config-fallback-warning, "danger": $runtime-config-fallback-danger), $runtime-key), $runtime-config-fallback-table-bg-scale) {',
  '    $table-variants: map-merge($table-variants, ($runtime-key: mix-color(if($runtime-table-bg-scale-is-negative, white, black), $runtime-source, if($runtime-table-bg-scale-is-negative, calc(-1 * $table-bg-scale), $table-bg-scale))));',
  '  }',
  '}',
  '@if map-get($runtime-map-fallback-table-variants, "light") == $runtime-config-fallback-light {',
  '  $table-variants: map-merge($table-variants, ("light": $light));',
  '}',
  '@if map-get($runtime-map-fallback-table-variants, "dark") == $runtime-config-fallback-dark {',
  '  $table-variants: map-merge($table-variants, ("dark": $dark));',
  '}',
  '$utilities-colors: $theme-colors-rgb;',
  '$utilities-text: map-merge(',
  '  $utilities-colors,',
  '  (',
  '    "black": to-rgb($black),',
  '    "white": to-rgb($white),',
  '    "body": to-rgb($body-color)',
  '  )',
  ');',
  '$utilities-text-colors: map-loop($utilities-text, rgba-css-var, "$key", "text");',
  '$utilities-bg: map-merge(',
  '  $utilities-colors,',
  '  (',
  '    "black": to-rgb($black),',
  '    "white": to-rgb($white),',
  '    "body": to-rgb($body-bg)',
  '  )',
  ');',
  '$utilities-bg-colors: map-loop($utilities-bg, rgba-css-var, "$key", "bg");',
  '$utilities-border: map-merge(',
  '  $utilities-colors,',
  '  (',
  '    "black": to-rgb($black),',
  '    "white": to-rgb($white)',
  '  )',
  ');',
  '$utilities-border-colors: map-loop($utilities-border, rgba-css-var, "$key", "border");',
  '$utilities-links-underline: map-loop($utilities-colors, rgba-css-var, "$key", "link-underline");',
  '// Runtime validation focus shadows apply only when the consumer kept the',
  '// stock channel-list expression, which the runtime -rgb colors invalidate.',
  '@each $runtime-state, $runtime-state-color in ("valid": "success", "invalid": "danger") {',
  '  @if map-has-key($runtime-map-fallback-form-validation-states, $runtime-state) and map-get(map-get($runtime-map-fallback-form-validation-states, $runtime-state), "focus-box-shadow") == map-get($runtime-stock-focus-shadows, $runtime-state) {',
  '    $form-validation-states: map-merge(',
  '      $form-validation-states,',
  '      ($runtime-state: map-merge(',
  '        map-get($form-validation-states, $runtime-state),',
  '        ("focus-box-shadow": 0 0 $input-btn-focus-blur $input-focus-width rgba-css-rgb-var($runtime-state-color, $input-btn-focus-color-opacity))',
  '      ))',
  '    );',
  '  }',
  '}',
  '$runtime-display-font-sizes: ();',
  '@each $display, $value in $runtime-display-font-sizes-fallback {',
  '  $runtime-display-font-sizes: map-merge(',
  '    $runtime-display-font-sizes,',
  '    ($display: var(--#{$prefix}config-display-#{$display}-font-size, #{$value}))',
  '  );',
  '}',
  '$display-font-sizes: $runtime-display-font-sizes;',
  '$runtime-font-sizes: ();',
  '@each $size, $value in $runtime-font-sizes-fallback {',
  '  $runtime-font-sizes: map-merge(',
  '    $runtime-font-sizes,',
  '    ($size: var(--#{$prefix}config-font-size-#{$size}, #{$value}))',
  '  );',
  '}',
  '$font-sizes: $runtime-font-sizes;',
  '$runtime-container-max-widths: ();',
  '@each $breakpoint, $value in $runtime-container-max-widths-fallback {',
  '  $runtime-container-max-widths: map-merge(',
  '    $runtime-container-max-widths,',
  '    ($breakpoint: var(--#{$prefix}config-container-max-width-#{$breakpoint}, #{$value}))',
  '  );',
  '}',
  '$container-max-widths: $runtime-container-max-widths;',
  '$runtime-spacers: ();',
  '@each $key, $value in $runtime-spacers-fallback {',
  '  $runtime-spacers: map-merge(',
  '    $runtime-spacers,',
  '    ($key: var(--#{$prefix}config-spacer-#{$key}, #{$value}))',
  '  );',
  '}',
  '// Re-derive the stock spacer scale from --#{$prefix}spacer only for entries',
  '// a consumer has not customized; customized entries keep their per-key token.',
  '$runtime-derived-spacers: (',
  '  0: 0,',
  '  1: calc(var(--#{$prefix}spacer) * .25),',
  '  2: calc(var(--#{$prefix}spacer) * .5),',
  '  3: var(--#{$prefix}spacer),',
  '  4: calc(var(--#{$prefix}spacer) * 1.5),',
  '  5: calc(var(--#{$prefix}spacer) * 3)',
  ');',
  '$runtime-default-spacers: (',
  '  0: 0,',
  '  1: $runtime-config-fallback-spacer * .25,',
  '  2: $runtime-config-fallback-spacer * .5,',
  '  3: $runtime-config-fallback-spacer,',
  '  4: $runtime-config-fallback-spacer * 1.5,',
  '  5: $runtime-config-fallback-spacer * 3',
  ');',
  '$spacers: $runtime-spacers;',
  '@each $key, $value in $runtime-derived-spacers {',
  '  @if map-has-key($runtime-spacers-fallback, $key) and map-get($runtime-spacers-fallback, $key) == map-get($runtime-default-spacers, $key) {',
  '    $spacers: map-merge($spacers, ($key: $value));',
  '  }',
  '}',
  '$runtime-gutters: ();',
  '@each $key, $value in $runtime-gutters-fallback {',
  '  $runtime-gutters: map-merge(',
  '    $runtime-gutters,',
  '    ($key: var(--#{$prefix}config-gutter-#{$key}, #{$value}))',
  '  );',
  '}',
  '// Stock Bootstrap aliases $gutters to $spacers; only inherit the spacer',
  '// scale when a consumer has not decoupled the two maps.',
  '$gutters: if($runtime-gutters-fallback == $runtime-spacers-fallback, $spacers, $runtime-gutters);',
  '$negative-spacers: if($enable-negative-margins, negativify-map($spacers), null);',
  ''
].join('\n')

const restoreOutput = [
  '// THIS FILE IS GENERATED BY build/generate-runtime-scss.mjs.',
  '// Restore Bootstrap 5 public Sass state after the runtime declaration pass.',
  '$enable-runtime-values: $runtime-enable-runtime-values-fallback !global;',
  ...restoreLines([...lightCandidates, ...darkCandidates]),
  ...runtimeMapNames.map(name => `$${name}: $runtime-map-fallback-${name} !global;`),
  ''
].join('\n')

function writeIfChanged(filePath, contents) {
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== contents) {
    fs.writeFileSync(filePath, contents)
  }
}

writeIfChanged(destination, output)
writeIfChanged(restoreDestination, restoreOutput)
process.stdout.write(
  `Generated ${path.relative(rootDir, destination)} and ${path.relative(rootDir, restoreDestination)} ` +
  `with ${scalarCandidates.size} runtime scalar tokens.\n`
)
