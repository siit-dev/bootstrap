# Releasing Smart Impact Bootstrap

Smart Impact releases are published from `main` as `@smartimpact-it/bootstrap` and use versions such as `5.3.8-smartimpact.1`. The Bootstrap base version is an explicit compatibility boundary for consuming themes.

## Prepare a release

1. Run `npm run release-version -- 5.3.8-smartimpact.N` and review the package and lockfile changes.
2. Run `npm run release-check` from a clean checkout.
3. Merge the release pull request into `main`.
4. Run the **Release** workflow manually on `main`, entering the exact package version.

The workflow validates the requested version and repository state, runs the complete validation suite, creates the npm tarball and standalone distribution ZIP, writes `SHA256SUMS`, and creates or resumes a draft GitHub release. It publishes the exact tarball to npm with the `latest` dist-tag before publishing the GitHub release. Although Smart Impact versions use a SemVer prerelease suffix, this package is the dedicated production distribution for its scope.

If a run fails after creating the draft, fix the cause and rerun the workflow with the same version. Existing npm versions are accepted only when their repository and git commit metadata match the current release commit.

## First release only

The initial package publication establishes the public npm package before trusted publishing can take over:

1. Merge the migration pull request.
2. From the matching `main` commit, run `npm ci`, `npm run release-check`, `npm pack`, and then publish the generated tarball with `npm publish <tarball> --access public` using an npm account with 2FA.
3. In npm package settings, configure the trusted publisher for GitHub organization `siit-dev`, repository `bootstrap`, and workflow `release.yml`.
4. Run the **Release** workflow for the same version. It verifies the existing npm package and creates the matching GitHub release.

All later releases use the workflow exclusively through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/). Do not configure a long-lived npm token; the public GitHub workflow receives short-lived OIDC credentials and npm records provenance automatically.

## Published artifacts

- npm tarball containing compiled CSS/JS, Sass sources, individual JavaScript plugins, maps, and `scss/runtime-tokens.json`
- `bootstrap-<version>-dist.zip` containing the standalone `dist/` tree
- `SHA256SUMS` covering both artifacts

GitHub source archives do not contain generated `dist/` or `js/dist/` files.
