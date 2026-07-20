/* global describe, it, expect, beforeEach, afterEach, pending */

'use strict'

describe('Bootstrap runtime CSS dependency graph', () => {
  let fixture
  let overrides

  const supportsRuntime = CSS.supports('color', 'color-mix(in srgb, red, blue)') &&
    CSS.supports('color', 'rgb(from red r g b)')

  const computed = (selector, property) => {
    return getComputedStyle(fixture.querySelector(selector)).getPropertyValue(property).trim()
  }

  const colorPixel = (selector, property) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = computed(selector, property)
    context.fillRect(0, 0, 1, 1)

    return [...context.getImageData(0, 0, 1, 1).data]
  }

  beforeEach(() => {
    fixture = document.createElement('div')
    fixture.innerHTML = `
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-primary active">Active primary</button>
      <button class="btn btn-success">Success</button>
      <button class="btn btn-danger">Danger</button>
      <div class="alert alert-primary">Alert</div>
      <table class="table"><tbody><tr class="table-primary"><td class="table-cell">Table</td></tr></tbody></table>
      <a class="link-primary">Link</a>
      <div class="text-primary bg-primary bg-opacity-50">Utility</div>
      <input class="form-control" value="Form">
      <div class="form-check"><input class="form-check-input" type="checkbox" checked></div>
      <nav class="navbar"><a class="navbar-brand">Nav</a></nav>
      <div class="p-3 rounded">Spacing</div>
      <h1>Responsive heading</h1>
      <div class="fs-1 runtime-fs">Responsive utility</div>
      <div data-bs-theme="dark"><div class="alert alert-primary dark-alert">Dark</div></div>
    `
    document.body.append(fixture)

    overrides = document.createElement('style')
    // Karma serves CSS links from the body, so append the theme after them to
    // model a Shopify theme stylesheet loaded after Bootstrap.
    document.body.append(overrides)
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--bs-primary')
    document.documentElement.style.removeProperty('--bs-spacer')
    document.documentElement.style.removeProperty('--bs-border-radius')
    document.documentElement.style.removeProperty('--bs-config-h1-font-size')
    fixture.remove()
    overrides.remove()
  })

  it('keeps stock rendering before overrides', () => {
    expect(computed('.btn-primary', 'background-color')).toBe('rgb(13, 110, 253)')
    expect(colorPixel('.btn-primary', 'color')).toEqual([255, 255, 255, 255])
    expect(colorPixel('.btn-primary.active', 'background-color')).toEqual([10, 88, 202, 255])
    expect(colorPixel('.btn-primary.active', 'border-color')).toEqual([10, 83, 190, 255])
    expect(colorPixel('.btn-primary.active', 'color')).toEqual([255, 255, 255, 255])
    expect(colorPixel('.btn-success', 'color')).toEqual([255, 255, 255, 255])
    expect(colorPixel('.btn-danger', 'color')).toEqual([255, 255, 255, 255])
    expect(computed('.p-3', 'padding-top')).toBe('16px')
    expect(computed('.rounded', 'border-radius')).toBe('6px')
    expect(computed('.form-check-input', 'margin-top')).toBe('4px')
    expect(colorPixel('.alert-primary', 'background-color')).toEqual([207, 226, 255, 255])
    expect(colorPixel('.table-cell', 'background-color')).toEqual([207, 226, 255, 255])
    expect(colorPixel('.link-primary', 'color')).toEqual([13, 110, 253, 255])
    expect(colorPixel('.dark-alert', 'background-color')).toEqual([3, 22, 51, 255])
  })

  it('propagates root colors through components, states, and alpha utilities', () => {
    if (!supportsRuntime) {
      pending('The installed browser does not implement color-mix() and relative colors.')
    }

    const before = {
      alert: computed('.alert-primary', 'background-color'),
      table: computed('.table-cell', 'background-color'),
      link: computed('.link-primary', 'color'),
      darkAlert: computed('.dark-alert', 'background-color')
    }

    overrides.textContent = ':root { --bs-primary: #7654ff; }'

    expect(getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim()).toBe('#7654ff')
    expect(computed('.btn-primary', '--bs-btn-bg')).toBe('#7654ff')
    expect(computed('.btn-primary', 'background-color')).toBe('rgb(118, 84, 255)')
    expect(colorPixel('.btn-primary.active', 'background-color')).toEqual([94, 67, 204, 255])
    expect(colorPixel('.btn-primary.active', 'border-color')).toEqual([89, 63, 191, 255])
    expect(colorPixel('.btn-primary.active', 'color')).toEqual([255, 255, 255, 255])
    expect(computed('.alert-primary', 'background-color')).not.toBe(before.alert)
    expect(computed('.table-cell', 'background-color')).not.toBe(before.table)
    expect(computed('.link-primary', 'color')).not.toBe(before.link)
    expect(computed('.dark-alert', 'background-color')).not.toBe(before.darkAlert)
    expect(computed('.bg-primary', 'background-color')).toContain('0.5')
  })

  it('recalculates contrast and tint branches when an input crosses the threshold', () => {
    if (!supportsRuntime) {
      pending('The installed browser does not implement color-mix() and relative colors.')
    }

    overrides.textContent = ':root { --bs-primary: #f8f9fa; }'

    expect(colorPixel('.btn-primary', 'color')).toEqual([0, 0, 0, 255])
    expect(colorPixel('.btn-primary.active', 'background-color')).toEqual([249, 250, 251, 255])
    expect(colorPixel('.btn-primary.active', 'border-color')).toEqual([249, 250, 251, 255])
    expect(colorPixel('.btn-primary.active', 'color')).toEqual([0, 0, 0, 255])
  })

  it('supports mixed-unit spacing, radii, and responsive values', () => {
    if (!supportsRuntime) {
      pending('The installed browser does not implement color-mix() and relative colors.')
    }

    const headingBefore = computed('h1', 'font-size')
    const utilityBefore = computed('.runtime-fs', 'font-size')
    overrides.textContent = `
      :root {
        --bs-spacer: calc(1rem + 2px);
        --bs-border-radius: .75rem;
        --bs-config-h1-font-size: calc(3rem + 2px);
      }
    `

    expect(computed('.p-3', 'padding-top')).toBe('18px')
    expect(computed('.rounded', 'border-radius')).toBe('12px')
    expect(computed('h1', 'font-size')).not.toBe(headingBefore)
    expect(computed('.runtime-fs', 'font-size')).not.toBe(utilityBefore)
  })

  it('keeps source-compatible channel declarations without a contrast feature gate', () => {
    const sheets = [...document.styleSheets]
    const bootstrapSheet = sheets.find(sheet => {
      return [...sheet.cssRules].some(rule => rule.cssText.includes('--bs-blue:'))
    })
    const css = [...bootstrapSheet.cssRules].map(rule => rule.cssText).join('\n')

    expect(css).toContain('--bs-primary-rgb: 13, 110, 253')
    expect(css).toContain('rgb(from var(--bs-primary)')
    expect(css).not.toContain('contrast-color(')
  })
})
