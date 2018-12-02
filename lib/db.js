"use strict";

function db(){

    //const Riak = require('basho-riak-client');
    var mongo = require('./mongo');
    //var mysql = require('./mysql');

    const logger = require('./logger');

    mongo.connect()
        .catch((err) => {
            logger.info(`mongo => unable to connected, err =>  ${err}`);
        });
    //mysql.connect();

    let collections = {};

    let that = this;

    this.getCollection = (name) => {

        return new Promise( ( fulfill, reject ) => {

            if (collections[name])
                return fulfill( collections[name] );

            that.createCollection(name)
                .then( (c) =>{
                    collections[name] = c;
                    fulfill(c);
                })
                .catch((err) =>{
                    reject(err);
                });
        });

    };

    this.createCollection = (name) => {
        return mongo.createCollection(name);
    };
/*
    this.useDatabase = (name) => {
        return mysql.useDatabase(name);
    };
*/
}

if (process.env.MONGO) {
    module.exports = new db();
}