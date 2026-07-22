<p align="center">
  <a href="https://github.com/siit-dev/bootstrap">
    <img src="https://getbootstrap.com/docs/5.3/assets/brand/bootstrap-logo-shadow.png" alt="Bootstrap logo" width="200" height="165">
  </a>
</p>

<h3 align="center">Smart Impact Bootstrap</h3>

<p align="center">
  A Shopify-oriented Bootstrap 5.3 distribution with reactive CSS color and spacing tokens.
  <br>
  <a href="https://getbootstrap.com/docs/5.3/"><strong>Explore Bootstrap docs »</strong></a>
  <br>
  <br>
  <a href="https://github.com/siit-dev/bootstrap/issues/new">Report bug</a>
  ·
  <a href="https://github.com/siit-dev/bootstrap/issues/new">Request feature</a>
  ·
  <a href="https://github.com/twbs/bootstrap">Upstream Bootstrap</a>
</p>


## Smart Impact Bootstrap 5

This public fork is maintained by Smart Impact for Shopify themes that need runtime-overridable design tokens and reactive derived values. It remains based on Bootstrap 5.3.8 and retains Bootstrap's MIT license, copyright, API, Sass, and JavaScript module structure.

The fork has its own release cadence and compatibility policy. Changes from [upstream Bootstrap](https://github.com/twbs/bootstrap) are selected and integrated through pull requests rather than inherited automatically.


## Table of contents

- [Quick start](#quick-start)
- [Distribution contract](#distribution-contract)
- [Status](#status)
- [What’s included](#whats-included)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Community](#community)
- [Versioning](#versioning)
- [Creators](#creators)
- [Thanks](#thanks)
- [Copyright and license](#copyright-and-license)


## Quick start

Shopify themes should install the fork through an [npm dependency alias](https://docs.npmjs.com/cli/v11/using-npm/package-spec/). This preserves existing `bootstrap/scss/...` and JavaScript imports:

```json
{
  "dependencies": {
    "bootstrap": "npm:@smartimpact-it/bootstrap@5.3.8-smartimpact.1"
  }
}
```

Alternatively, install the scoped package directly with `npm install @smartimpact-it/bootstrap@5.3.8-smartimpact.1`.

For source development:

- Clone the repository: `git clone git@github.com:siit-dev/bootstrap.git`
- Install dependencies: `npm ci`
- Generate the distributions: `npm run dist`

Generated `dist/` and `js/dist/` files are intentionally absent from source control. They are rebuilt for npm packages and GitHub releases, so GitHub's automatic source archives are not standalone distributions.


## Distribution contract

The package keeps Bootstrap's established entry points (`main`, `module`, `style`, and `sass`) and includes compiled CSS, RTL CSS, JavaScript bundles, individual plugins, source maps, Sass sources, and `scss/runtime-tokens.json`.

Custom releases use `5.3.8-smartimpact.N`. Moving to a different upstream Bootstrap release changes the base version and is an explicit upgrade for consuming themes. `npm run release-version -- <version>` updates only the package and lockfile version; Bootstrap's upstream runtime/API version remains separate.

Read Bootstrap's [Getting started page](https://getbootstrap.com/docs/5.3/getting-started/introduction/) for the upstream framework documentation.


## Status

[![Build Status](https://img.shields.io/github/actions/workflow/status/siit-dev/bootstrap/css.yml?branch=main&label=CSS%20Tests&logo=github)](https://github.com/siit-dev/bootstrap/actions)
[![npm version](https://img.shields.io/npm/v/%40smartimpact-it%2Fbootstrap?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@smartimpact-it/bootstrap)


## What’s included

Within the download you’ll find the following directories and files, logically grouping common assets and providing both compiled and minified variations.

<details>
  <summary>Download contents</summary>

  ```text
  bootstrap/
  ├── css/
  │   ├── bootstrap-grid.css
  │   ├── bootstrap-grid.css.map
  │   ├── bootstrap-grid.min.css
  │   ├── bootstrap-grid.min.css.map
  │   ├── bootstrap-grid.rtl.css
  │   ├── bootstrap-grid.rtl.css.map
  │   ├── bootstrap-grid.rtl.min.css
  │   ├── bootstrap-grid.rtl.min.css.map
  │   ├── bootstrap-reboot.css
  │   ├── bootstrap-reboot.css.map
  │   ├── bootstrap-reboot.min.css
  │   ├── bootstrap-reboot.min.css.map
  │   ├── bootstrap-reboot.rtl.css
  │   ├── bootstrap-reboot.rtl.css.map
  │   ├── bootstrap-reboot.rtl.min.css
  │   ├── bootstrap-reboot.rtl.min.css.map
  │   ├── bootstrap-utilities.css
  │   ├── bootstrap-utilities.css.map
  │   ├── bootstrap-utilities.min.css
  │   ├── bootstrap-utilities.min.css.map
  │   ├── bootstrap-utilities.rtl.css
  │   ├── bootstrap-utilities.rtl.css.map
  │   ├── bootstrap-utilities.rtl.min.css
  │   ├── bootstrap-utilities.rtl.min.css.map
  │   ├── bootstrap.css
  │   ├── bootstrap.css.map
  │   ├── bootstrap.min.css
  │   ├── bootstrap.min.css.map
  │   ├── bootstrap.rtl.css
  │   ├── bootstrap.rtl.css.map
  │   ├── bootstrap.rtl.min.css
  │   └── bootstrap.rtl.min.css.map
  └── js/
      ├── bootstrap.bundle.js
      ├── bootstrap.bundle.js.map
      ├── bootstrap.bundle.min.js
      ├── bootstrap.bundle.min.js.map
      ├── bootstrap.esm.js
      ├── bootstrap.esm.js.map
      ├── bootstrap.esm.min.js
      ├── bootstrap.esm.min.js.map
      ├── bootstrap.js
      ├── bootstrap.js.map
      ├── bootstrap.min.js
      └── bootstrap.min.js.map
  ```
</details>

We provide compiled CSS and JS (`bootstrap.*`), as well as compiled and minified CSS and JS (`bootstrap.min.*`). [Source maps](https://web.dev/articles/source-maps) (`bootstrap.*.map`) are available for use with certain browsers’ developer tools. Bundled JS files (`bootstrap.bundle.js` and minified `bootstrap.bundle.min.js`) include [Popper](https://popper.js.org/docs/v2/).


## Bugs and feature requests

Have a fork-specific bug or feature request? Search existing and closed issues, then [open an issue](https://github.com/siit-dev/bootstrap/issues/new). Report issues reproducible in unmodified Bootstrap to the [upstream project](https://github.com/twbs/bootstrap/issues/new/choose).


## Documentation

Bootstrap’s documentation, included in this repository, is built with [Astro](https://astro.build/). The upstream documentation is hosted at <https://getbootstrap.com/>. The docs may also be run locally.

Documentation search is powered by [Algolia's DocSearch](https://docsearch.algolia.com/).

### Running documentation locally

1. Run `npm ci` to install the Node.js dependencies, including Astro (the site builder).
2. Run `npm run docs-build`; it rebuilds the untracked CSS and JavaScript distributions before building the docs.
3. From the root `/bootstrap` directory, run `npm run docs-serve` in the command line.
4. Open <http://localhost:9001> in your browser, and voilà.

Learn more about using Astro by reading its [documentation](https://docs.astro.build/en/getting-started/).

### Documentation for previous releases

You can find all our previous releases docs on <https://getbootstrap.com/docs/versions/>.

[Previous releases](https://github.com/twbs/bootstrap/releases) and their documentation are also available for download.


## Contributing

Please read through our [contributing guidelines](https://github.com/siit-dev/bootstrap/blob/main/.github/CONTRIBUTING.md). Included are directions for opening issues, coding standards, and notes on development.

Moreover, if your pull request contains JavaScript patches or features, you must include [relevant unit tests](https://github.com/twbs/bootstrap/tree/main/js/tests). All HTML and CSS should conform to the [Code Guide](https://github.com/mdo/code-guide), maintained by [Mark Otto](https://github.com/mdo).

Editor preferences are available in the [editor config](https://github.com/twbs/bootstrap/blob/main/.editorconfig) for easy use in common text editors. Read more and download plugins at <https://editorconfig.org/>.


## Community

Get updates on Bootstrap’s development and chat with the project maintainers and community members.

- Follow [@getbootstrap on X](https://x.com/getbootstrap).
- Read and subscribe to [The Official Bootstrap Blog](https://blog.getbootstrap.com/).
- Ask questions and explore [our GitHub Discussions](https://github.com/twbs/bootstrap/discussions).
- Discuss, ask questions, and more on [the community Discord](https://discord.gg/bZUvakRU3M) or [Bootstrap subreddit](https://www.reddit.com/r/bootstrap/).
- Chat with fellow Bootstrappers in IRC. On the `irc.libera.chat` server, in the `#bootstrap` channel.
- Implementation help may be found at Stack Overflow (tagged [`bootstrap-5`](https://stackoverflow.com/questions/tagged/bootstrap-5)).
- Developers should use the keyword `bootstrap` on packages which modify or add to the functionality of Bootstrap when distributing through [npm](https://www.npmjs.com/browse/keyword/bootstrap) or similar delivery mechanisms for maximum discoverability.


## Versioning

Smart Impact release versions combine the upstream Bootstrap base with a fork revision, for example `5.3.8-smartimpact.1`. Revisions with the same base preserve the supported Bootstrap 5.3 API unless a release note explicitly says otherwise. A new base version is treated as an explicit dependency upgrade.

See [this repository's releases](https://github.com/siit-dev/bootstrap/releases) for fork changelogs and [Bootstrap's releases](https://github.com/twbs/bootstrap/releases) for upstream history.


## Creators

**Mark Otto**

- <https://x.com/mdo>
- <https://github.com/mdo>

**Jacob Thornton**

- <https://x.com/fat>
- <https://github.com/fat>


## Thanks

<a href="https://www.browserstack.com/">
  <img src="https://live.browserstack.com/images/opensource/browserstack-logo.svg" alt="BrowserStack" width="192" height="42">
</a>

Thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to test in real browsers!

<a href="https://www.netlify.com/">
  <img src="https://www.netlify.com/v3/img/components/full-logo-light.svg" alt="Netlify" width="147" height="40">
</a>

Thanks to [Netlify](https://www.netlify.com/) for providing us with Deploy Previews!


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/bootstrap#sponsor)]

[![OC sponsor 0](https://opencollective.com/bootstrap/sponsor/0/avatar.svg)](https://opencollective.com/bootstrap/sponsor/0/website)
[![OC sponsor 1](https://opencollective.com/bootstrap/sponsor/1/avatar.svg)](https://opencollective.com/bootstrap/sponsor/1/website)
[![OC sponsor 2](https://opencollective.com/bootstrap/sponsor/2/avatar.svg)](https://opencollective.com/bootstrap/sponsor/2/website)
[![OC sponsor 3](https://opencollective.com/bootstrap/sponsor/3/avatar.svg)](https://opencollective.com/bootstrap/sponsor/3/website)
[![OC sponsor 4](https://opencollective.com/bootstrap/sponsor/4/avatar.svg)](https://opencollective.com/bootstrap/sponsor/4/website)
[![OC sponsor 5](https://opencollective.com/bootstrap/sponsor/5/avatar.svg)](https://opencollective.com/bootstrap/sponsor/5/website)
[![OC sponsor 6](https://opencollective.com/bootstrap/sponsor/6/avatar.svg)](https://opencollective.com/bootstrap/sponsor/6/website)
[![OC sponsor 7](https://opencollective.com/bootstrap/sponsor/7/avatar.svg)](https://opencollective.com/bootstrap/sponsor/7/website)
[![OC sponsor 8](https://opencollective.com/bootstrap/sponsor/8/avatar.svg)](https://opencollective.com/bootstrap/sponsor/8/website)
[![OC sponsor 9](https://opencollective.com/bootstrap/sponsor/9/avatar.svg)](https://opencollective.com/bootstrap/sponsor/9/website)


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/bootstrap#backer)]

[![Backers](https://opencollective.com/bootstrap/backers.svg?width=890)](https://opencollective.com/bootstrap#backers)


## Copyright and license

Code and documentation copyright 2011-2026 the [Bootstrap Authors](https://github.com/twbs/bootstrap/graphs/contributors). Smart Impact maintains this modified distribution without removing upstream attribution. Code is released under the repository's [MIT License](LICENSE). Upstream docs are released under [Creative Commons](https://creativecommons.org/licenses/by/3.0/).
