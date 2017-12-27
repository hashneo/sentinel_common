'use strict';

const flatten = require('flat');
const guid = require('node-uuid');

function mongo(){

    const MongoClient = require('mongodb').MongoClient;

    var connection = undefined;

    this.connect = (config) => {

        return new Promise((fulfill, reject) => {

            MongoClient.connect('mongodb://' + ( process.env.MONGO || global.config.mongo || 'localhost:27017/sentinel' ), (err, _connection) => {

                if (err)
                    return reject(err);

                connection = _connection;

                console.log("mongo => We are connected");

                fulfill(this);
            });
        });
    };

    this.createCollection = (name) => {

        return new Promise((fulfill, reject) => {

            if (!connection)
                return reject( new Error('no connection') );

            connection.createCollection(name, (err, _collection) => {
                if (err)
                    return reject(err);

                fulfill(new collection(_collection, name));
            });
        });
    };
}

function collection(_c,_n){
    var c = _c;
    var n = _n;

    this.find = (uuid, id, criteria) => {

        return new Promise( (fulfill, reject) => {

            if ( uuid === id === criteria === undefined )
                return reject( new Error('invalid parameters for find') );

            let query = {
            };

            if ( uuid ){
                query['owner'] = uuid;
            }

            if ( id ){
                query['_id'] = id;
            }

            if ( criteria !== undefined ){
                for ( let k in criteria ){
                    if ( k === '$or' ){
                        for ( let i in criteria[k] ){
                            criteria[k][i] = flatten( { value : criteria[k][i] } );
                        }
                        query[k] = criteria[k];
                    }else{
                        query['value'] = flatten( criteria );
                        query = flatten( query );
                    }
                }
            }

            c.find(query).toArray(
                (err, docs) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (docs && docs.length > 0) {
                            let data = [];
                            docs.forEach( (d) => {
                                data.push(d.value);
                            });
                            fulfill(data);
                        }else {
                            fulfill(null);
                        }
                    }
                }
            );
        });
    };

    this.insert = (uuid, value) => {

        return new Promise( (fulfill, reject) => {

            if ( !value.id )
                value.id = guid.v4();

            let data = {
                _id : value.id,
                owner: uuid,
                value: value
            };

            c.insert( data,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        fulfill(data.value);
                    }
                }
            );
        });
    };

    this.update = (uuid, value) => {

        return new Promise( (fulfill, reject) => {

            let key = {
                _id: value.id,
                owner: uuid
            };

            let data = Object.assign({}, key, { value } );

            c.update( key, data,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        fulfill(data.value);
                    }
                }
            );
        });
    };

    this.delete = (uuid, value) => {

        return new Promise( (fulfill, reject) => {

            let key = {
                _id: value.id,
                owner: uuid
            };

            c.deleteOne( key,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        fulfill();
                    }
                }
            );
        });
    };

    this.drop = () => {
        return new Promise( (fulfill, reject) => {
            c.drop( (err, result) =>  {
                if ( err )
                    reject(err);
                else
                    fulfill(result);
            });
        });
    }
}

module.exports = new mongo();