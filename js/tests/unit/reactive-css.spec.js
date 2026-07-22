describe('reactive CSS tokens', () => {
  let css
  let container
  let host

  beforeAll(async () => {
    const response = await fetch('/base/dist/css/bootstrap.css')
    const cssContent = await response.text()

    css = cssContent.replace(':root,', ':host,')
  })

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    const shadowRoot = container.attachShadow({ mode: 'open' })

    shadowRoot.innerHTML = `<style>${css}</style><div id="reactive-css-fixture"></div>`
    host = shadowRoot.getElementById('reactive-css-fixture')
  })

  afterEach(() => {
    container.remove()
  })

  it('updates component colors when a theme source changes', () => {
    if (!CSS.supports('color', 'color-mix(in srgb, black, white)')) {
      pending('This build requires color-mix()')
    }

    host.innerHTML = [
      '<button class="btn btn-primary">Button</button>',
      '<div class="alert alert-primary">Alert</div>',
      '<table class="table table-primary"><tbody><tr><td>Table</td></tr></tbody></table>',
      '<div class="progress"><div class="progress-bar">Progress</div></div>',
      '<nav class="nav nav-pills"><a class="nav-link active">Active</a></nav>',
      '<ul class="pagination"><li class="page-item"><a class="page-link active">1</a></li></ul>',
      '<div class="accordion"><button class="accordion-button">Accordion</button></div>',
      '<input class="form-check-input" type="checkbox" checked>',
      '<a class="test-link-hover" style="color: var(--bs-link-hover-color)">Link</a>',
      '<span class="text-primary">Text</span>',
      '<span class="bg-primary">Background</span>'
    ].join('')

    const selectors = [
      ['.btn-primary', 'backgroundColor'],
      ['.alert-primary', 'backgroundColor'],
      ['.table-primary td', 'backgroundColor'],
      ['.progress-bar', 'backgroundColor'],
      ['.nav-link.active', 'backgroundColor'],
      ['.page-link.active', 'backgroundColor'],
      ['.accordion-button', 'backgroundColor'],
      ['.form-check-input', 'backgroundColor'],
      ['.test-link-hover', 'color'],
      ['.text-primary', 'color'],
      ['.bg-primary', 'backgroundColor']
    ]
    for (const [selector] of selectors) {
      host.querySelector(selector).style.transition = 'none'
    }

    const before = selectors.map(([selector, property]) => getComputedStyle(host.querySelector(selector))[property])

    const root = host.getRootNode().host

    root.style.setProperty('--bs-primary', 'rgb(180, 35, 95)')
    // Opacity utilities intentionally retain Bootstrap's public RGB-channel contract.
    root.style.setProperty('--bs-primary-rgb', '180, 35, 95')
    root.style.setProperty('--bs-primary-contrast', '#fff')
    root.style.setProperty('--bs-link-color', 'rgb(180, 35, 95)')

    const after = selectors.map(([selector, property]) => getComputedStyle(host.querySelector(selector))[property])

    for (const [index, value] of after.entries()) {
      expect(value).not.toBe(before[index], selectors[index][0])
    }

    expect(getComputedStyle(host.querySelector('.btn-primary')).backgroundColor).toBe('rgb(180, 35, 95)')
    expect(getComputedStyle(host.querySelector('.text-primary')).color).toBe('rgb(180, 35, 95)')
  })

  it('updates spacing and grid gutters from --bs-spacer', () => {
    host.innerHTML = [
      '<div class="m-4">Margin</div>',
      '<div class="row g-2"><div class="col">Column</div></div>'
    ].join('')

    host.getRootNode().host.style.setProperty('--bs-spacer', '20px')

    expect(getComputedStyle(host.querySelector('.m-4')).marginTop).toBe('30px')
    expect(getComputedStyle(host.querySelector('.row')).getPropertyValue('--bs-gutter-x').trim()).toBe('calc(20px * 0.5)')
    expect(getComputedStyle(host.querySelector('.col')).paddingLeft).toBe('5px')
  })

  it('keeps a theme-scale mutation below the experimental runtime pass', () => {
    host.innerHTML = '<button class="btn btn-primary" style="transition: none">Button</button>'.repeat(2000)

    const root = host.getRootNode().host
    const lastButton = host.lastElementChild
    const samples = []

    for (let index = 0; index < 25; index++) {
      const start = performance.now()

      root.style.setProperty('--bs-primary', index % 2 === 0 ? '#7654ff' : '#b4235f')
      getComputedStyle(lastButton).getPropertyValue('background-color')

      if (index >= 5) {
        samples.push(performance.now() - start)
      }
    }

    samples.sort((first, second) => first - second)
    const median = samples[Math.floor(samples.length / 2)]
    const p95 = samples[Math.ceil(samples.length * 0.95) - 1]

    console.info(`[reactive-css] 2,000 buttons: median ${median.toFixed(2)}ms, p95 ${p95.toFixed(2)}ms`)
    expect(median).toBeLessThan(23)
    expect(p95).toBeLessThan(24)
  })
})
