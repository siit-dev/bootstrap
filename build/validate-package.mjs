import childProcess from 'node:child_process'
import process from 'node:process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const rootDirectory = new URL('..', import.meta.url)
const build = childProcess.spawnSync(npmCommand, ['run', 'dist'], {
  cwd: rootDirectory,
  stdio: 'inherit',
  env: process.env
})

if (build.status !== 0) {
  throw new Error('Distribution build failed')
}

const result = childProcess.spawnSync(npmCommand, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: rootDirectory,
  encoding: 'utf8',
  env: process.env
})

if (result.status !== 0) {
  process.stderr.write(result.stderr)
  throw new Error('npm pack --dry-run failed')
}

const packResult = JSON.parse(result.stdout)
const files = new Set(packResult[0].files.map(file => file.path))
const requiredFiles = [
  'dist/css/bootstrap.css',
  'dist/css/bootstrap.css.map',
  'dist/css/bootstrap.rtl.min.css',
  'dist/js/bootstrap.bundle.js',
  'dist/js/bootstrap.bundle.min.js.map',
  'js/dist/alert.js',
  'js/dist/alert.js.map',
  'scss/bootstrap.scss',
  'scss/runtime-tokens.json'
]
const missingFiles = requiredFiles.filter(file => !files.has(file))

if (missingFiles.length > 0) {
  throw new Error(`Package is missing required files:\n${missingFiles.join('\n')}`)
}

console.log(`Validated ${packResult[0].filename} (${files.size} files)`)
