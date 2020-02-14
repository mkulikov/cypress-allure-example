const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');

const fs = require("fs");
const os = require("os");
const child_process = require('child_process');
const psTree = require('ps-tree');
const Promise = require('bluebird');
const clipboardy = require('clipboardy');

module.exports = on => {

    require('cypress-plugin-retries/lib/plugin')(on)

    on('file:preprocessor', cypressTypeScriptPreprocessor);

    on('task', {
        startServer() {
            let cyserverport = process.env.CY_SERVER_PORT;
            if (cyserverport) {
                return cyserverport
            }
            let file = os.tmpdir() + "/cyport";
            if (fs.existsSync(file)) {
                fs.unlink(file)
            }
            let opts = {
                cwd: '../applications/traderx_frontend/',
                stdio: [process.stdin, process.stdout, process.stderr, 'ipc']
            };

            let server = child_process.spawn('yarn', ['run', 'ts-node', '--transpile-only', '--project', 'tsconfig.json', 'config/runAppServer.ts', '-w', file], opts);
            process.env.CY_SERVER_PID = server.pid;

            let serverStartTimeout = 100000;
            return new Promise((resolve, reject) => {
                const id = setInterval(() => {
                    if (fs.existsSync(file)) {
                        cyserverport = fs.readFileSync(file).toString();
                        process.env.CY_SERVER_PORT = cyserverport;
                        clearInterval(id);
                        resolve(cyserverport)
                    }
                }, 1000)
            }).timeout(serverStartTimeout, `failed to wait for server to start in ${serverStartTimeout} ms`)
        },
        async stopServer() {
            let cyserverpid = process.env.CY_SERVER_PID;
            if (!cyserverpid) {
                return null
            }
            let stop = Promise.fromNode(cb => psTree(cyserverpid, cb))
                .then(children => {
                    children.forEach(child => {
                        try {
                            process.kill(child.PID, 'SIGINT')
                        } catch (e) {
                            if (e.code === 'ESRCH') {
                                console.log(
                                    `Child process ${child.PID} exited before trying to stop it`
                                )
                            } else {
                                throw e
                            }
                        }
                    })
                })
                .then(() => {
                    process.kill(cyserverpid, 'SIGINT')

                });
            await stop;  // cypress for some reason forbids returning such a promise, so awaiting it on the spot
            return null
        },
        getClipboard () {
            return clipboardy.readSync();
        }
    })

    on('before:browser:launch', (browser = {}, args) => {
        let port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT)
        if (port) {
            if (browser.name === 'chrome') {
                args.push('--inspect')
                args.push(`--remote-debugging-port=${port}`)
            }
        }
    })
};
