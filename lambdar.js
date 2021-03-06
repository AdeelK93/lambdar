'use strict';

const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

/** The version of R */
const version = '3.4.1';

function spawn(command, args) {
    const output = spawnSync(command, args, {
        env: {
            HOME: process.cwd(),
            LD_LIBRARY_PATH: '/tmp/r/${version}/lib64/R/lib'
        }
    });
    if (output.error != null) {
        console.log(output);
        return output.error.toString();
    }
    const s = output.stdout.toString() + output.stderr.toString();
    console.log(s);
    return s;
}

function install_r() {
    if (fs.existsSync('/tmp/r'))
        return;
    spawn('tar', ['xf', `/var/task/r-${version}.tar.gz`, '-C', '/tmp']);
}

function chdir_home() {
    const path = `/tmp/${process.pid}.${Math.random()}`;
    fs.mkdirSync(path);
    process.env.HOME = path;
    process.chdir(path);
}

function eval_r(data) {
    chdir_home();
    // Create temporary file for pdf
    const tempFile = `/tmp/${Math.random()}.pdf`
    fs.writeFileSync(tempFile, data, 'base64')
    console.log(typeof data)
    // Extract text using R (cat to suppress line numbers)
    const text = spawn(`/tmp/r/${version}/bin/Rscript`, ['-e', `cat(pdftools::pdf_text('${tempFile}'))`])
    fs.unlink(tempFile)

    return text;
}

/**
 * Transfer bottles from CircleCI to BinTray and GitHub
 */
exports.handler = (event, context, callback) => {
    console.log('Received event:'/*, JSON.stringify(event, null, 2)*/);

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : res,
        headers: {
            'Content-Type': 'text/plain',
        },
    });

    const redirect = (url) => callback(null, {
        statusCode: 303,
        headers: { 'Content-Type': 'text/html', 'Location': url },
        body: `<html><body>You are being <a href="${url}">redirected</a>.</body></html>`
    });

    switch (event.httpMethod) {
        case 'GET':
            if (event.queryStringParameters == null || !('e' in event.queryStringParameters)) {
                redirect('https://github.com/sjackman/lambdar');
                break;
            }
        case 'POST':
            const file = event.body;
            //console.log(expr);
            install_r();
            done(null, eval_r(file));
            break;
        default:
            done(new Error(`lambdar: Unsupported HTTP method "${event.httpMethod}"`));
    }
};
