"use strict";

const flatten = require('flat');
const guid = require('node-uuid');

function datastore(){
    const path = require('path');

    var db = undefined;

    this.connect = () => {

        db = gcloud.datastore({
            projectId: 'sentinel',
            keyFilename: path.normalize( path.resolve( __dirname, '..', 'config', 'gc.json' ) )
        });

        return this;
    };

    this.createCollection = (name) => {
        return new collection(db, name);
    };
}

function collection(_c,_n){
    var c = _c;
    var n = _n;

    this.find = (uuid, id, criteria) => {

        return new Promise( (fulfill, reject) => {
            reject();
        });
    };

    this.insert = (uuid, value) => {

        return new Promise( (fulfill, reject) => {

            if ( !value.id )
                value.id = guid.v4();

            let key = c.key( {
                namespace: _n,
                path: [ uuid, value.id ]
            });

            let entities = [];

            function dsIt(key, o){

                let data = {};

                Object.keys(o).forEach( (k) =>{
                    if ( typeof o[k] === 'object' ) {

                        let subKey = c.key( {
                            namespace: key.namespace,
                            path: key.path.concat( [k, guid.v4()] )
                        });

                        dsIt( subKey, o[k]);
                    } else {
                        data[k] = o[k];
                    }
                });


                var entity = {
                    key: key,
                    data: data
                };

                entities.push( entity );
            }

            dsIt(key,value);

            c.save( entities,
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        entity['id'] = entity.key.id;
                        fulfill(entity);
                    }
                }
            );
        });
    };

    this.replace = (uuid, value) => {

        return new Promise( (fulfill, reject) => {
            reject();
        });
    };

    this.delete = (uuid, value) => {

        return new Promise( (fulfill, reject) => {
            reject();
        });
    }
}

module.exports = new datastore();