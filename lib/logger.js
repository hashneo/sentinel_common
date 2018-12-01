'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const chalk = require('chalk');

if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = (process.env.DEBUG) ? 'DEBUG' : 'ERROR';
}

const logFormat = printf( info => {

    let f = chalk.white;

    switch (info.level) {
        case 'fatal':
        case 'error':
            f = chalk.bold.red;
            break;
        case 'warn':
            f = chalk.yellow;
            break;
        case 'info':
            f = chalk.green;
            break;
        case 'debug':
            f = chalk.white;
            break;
        case 'trace':
            f = chalk.white;
            break;
    }

    return `${info.timestamp} ${f(info.level.toUpperCase())} ${process.pid} ${process.env.HOSTNAME || '-'} : ${info.message}`;
});

const logger = createLogger({
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        verbose: 4,
        debug: 5,
        trace: 6
    },
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console({level: process.env.LOG_LEVEL.toLowerCase()})
    ]
});

module.exports = logger;