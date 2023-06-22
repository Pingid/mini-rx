const { spawn } = require('child_process')
const fs = require('fs')

spawn('node_modules/.bin/tsc', ['-p', 'tsconfig-cjs.json'])
const esm = spawn('node_modules/.bin/tsc', ['-p', 'tsconfig-esm.json'])

esm.on('exit', () => {
  fs.readdirSync('lib/esm').map((x) => {
    if (/\.js$/.test(x)) {
      const contents = fs.readFileSync(`lib/esm/${x}`, 'utf-8')
      fs.writeFileSync(
        `lib/esm/${x}`,
        contents.replace(/\sfrom\s('\.\/.*?')/gm, (_, b) => ` from ${b.replace(/'$/, `.js'`)}`),
      )
      fs.writeFileSync(
        `lib/esm/${x.replace(/js$/, 'mjs')}`,
        contents.replace(/\sfrom\s('\.\/.*?')/gm, (_, b) => ` from ${b.replace(/'$/, `.mjs'`)}`),
      )
    }
    if (/\.d.ts$/.test(x)) fs.copyFileSync(`lib/esm/${x}`, `lib/esm/${x.replace(/ts$/, 'mts')}`)
  })
})
