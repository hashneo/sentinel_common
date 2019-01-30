'use strict';

const jose = require('node-jose');
const rp = require('request-promise');
const keyStore = jose.JWK.createKeyStore();
const jwtDecode = require('jwt-decode');
const logger = require('./logger');

let signatureKey;
let that = this;

function loadPublicKey(uri) {

    return new Promise( function (fulfill, reject) {
        let options = {
            uri: uri,
            rejectUnauthorized: false,
            json: true
        };

        rp(options)
            .then((signature) => {
                keyStore.add(signature, 'pem')
                    .then(function (result) {
                        signatureKey = result;
                        fulfill(signatureKey);
                    })
                    .catch(function (err) {
                        return reject(err);
                    });
            })
            .catch((err) => {
                logger.error(err);
                return reject(err);
            });
    });
}

module.exports.verify = (jwt) => {

    return new Promise( function (fulfill, reject) {

        if ( !signatureKey ){

            let key = 'https://home.steventaylor.me/api/auth/publickey';

            loadPublicKey( key )
                .then( (signature) => {
                    signatureKey = signature;
                    that.verify(jwt)
                        .then((claims)=>{
                            fulfill(claims);
                        })
                        .catch( (err) => {
                            return reject(err);
                        });
                })
                .catch( (err) =>{
                    return reject(err);
                });

            return;
        }

        try {
            jose.JWS.createVerify(signatureKey)
                .verify(jwt)
                .then(function (result) {
                    let claims = JSON.parse(result.payload.toString('utf8'));
                    fulfill(claims);
                })
                .catch(function (err) {
                    reject(err);
                });
        }catch(err){
            reject(err);
        }
    });
};
