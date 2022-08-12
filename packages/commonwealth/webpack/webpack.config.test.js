const merge = require('webpack-merge');
const dev = require('./webpack.config.dev.js');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');

/*
module.exports = merge(dev, {
  plugins: [
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          const newEnv = process.env;
          newEnv['RESET_DB'] = true;
          const serverProc = spawn('yarn', ['server'], { env: newEnv });
          //serverProc.stdout.on('data', (data) => console.log(`SERVER STDOUT: ${data}`));
          //serverProc.stderr.on('data', (data) => console.log(`SERVER STDERR: ${data}`));
          serverProc.on('close', (code) => { console.log(`SERVER exited with code ${code}`); });

          const edgewarePath = path.join(process.env['EDG_DIR'] ? process.env['EDG_DIR'] : '/usr/local/bin/', 'edgeware');
          const edgewareProc = spawn(edgewarePath, ['--chain=cwci', '--alice', '--validator', '--force-authoring']);
          //edgewareProc.stdout.on('data', (data) => console.log(`EDG STDOUT: ${data}`));
          //edgewareProc.stderr.on('data', (data) => console.log(`EDG STDERR: ${data}`));
          edgewareProc.on('close', (code) => { console.log(`EDGEWARE exited with code ${code}`); });

          const proc = exec('sleep 8 && ./node_modules/mocha/bin/mocha --recursive integration-tests/');
          proc.stdout.pipe(process.stdout);
          proc.stderr.pipe(process.stderr);
          proc.on('close', (code) => {
            console.log(`Integration tests exited with code ${code}`);
            serverProc.kill();
            edgewareProc.kill();
            process.exit(code);
          });
        });
      }
    }
  ]
});
*/
module.exports = dev;