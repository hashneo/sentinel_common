'use strict';

const chalk = require('chalk');
const util = require('util');

let DEBUG_ENABLED = false;

// Turns on debug level logging
function setDebugEnabled(enabled) {
  DEBUG_ENABLED = enabled;
}

// global cache of logger instances by plugin name
let loggerCache = {};

/**
 * Logger class
 */

function Logger(prefix) {

    this.prefix = prefix;

    this.debug = function(msg) {
        if (DEBUG_ENABLED)
            this.log.apply(this, ['debug'].concat(Array.prototype.slice.call(arguments)));
    };

    this.info = function(msg) {
        this.log.apply(this, ['info'].concat(Array.prototype.slice.call(arguments)));
    };

    this.warn = function(msg) {
        this.log.apply(this, ['warn'].concat(Array.prototype.slice.call(arguments)));
    };

    this.error = function(msg) {
        this.log.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)));
    };

    this.log = function(level, msg) {

        msg = util.format.apply(util, Array.prototype.slice.call(arguments, 1));
        let func = console.log;

        if (level === 'debug') {
            msg = chalk.gray(msg);
        }
        else if (level === 'warn') {
            msg = chalk.yellow(msg);
            func = console.error;
        }
        else if (level === 'error') {
            msg = chalk.bold.red(msg);
            func = console.error;
        }

        // prepend prefix if applicable
        if (this.prefix)
            msg = chalk.cyan("[" + this.prefix +  "]") + " " + msg;

        // prepend timestamp
        let date = new Date();
        msg =  chalk.white("[" + date.toLocaleString() + "]") + " " + msg;

        func(msg);
    };

    Logger.withPrefix = function(prefix) {

        if (!loggerCache[prefix]) {
            // create a class-like logger thing that acts as a function as well
            // as an instance of Logger.
            let logger = new Logger(prefix);
            let log = logger.info.bind(logger);
            log.debug = logger.debug;
            log.info = logger.info;
            log.warn = logger.warn;
            log.error = logger.error;
            log.log = logger.log;
            log.prefix = logger.prefix;
            loggerCache[prefix] = log;
        }

        return loggerCache[prefix];
    };
}

module.exports = Logger;
