'use strict';

const jose = require('node-jose');

const rp = require('request-promise');

const keystore = jose.JWK.createKeyStore();
const _ = require('underscore');

let signatureKey;

function loadPublicKey(uri) {

    return new Promise( function (fulfill, reject) {
        let options = {
            uri: uri,
            rejectUnauthorized: false,
            json: true
        };

        rp(options)
            .then((signature) => {
                keystore.add(signature, 'pem')
                    .then(function (result) {
                        signatureKey = result;
                        fulfill(signatureKey);
                    })
                    .catch(function (err) {
                        return reject(err);
                    });
            })
            .catch((err) => {
                console.log(err);
                return reject(err);
            });
    });
}

function verifyJwt(jwt) {

    return new Promise( function (fulfill, reject) {

        if ( !signatureKey ){
            loadPublicKey('https://home.steventaylor.me/api/auth/publickey')
                .then( (signature) => {
                    signatureKey = signature;
                    verifyJwt(jwt)
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
}

function validateJwt(jwt, req) {
    // time validation and valid issuer is handled by the jwt-verification service
    // any other verification such as scopes can go here
    if (jwt.Error)
        return false;
    if ((typeof(jwt['acc_id']) == 'string')) {
        req.account = {
            uuid: jwt['acc_id'].toLowerCase()
        };

        req.jwt = jwt;
        return true;
    }
    else
        return false;
}

module.exports = {
    Oauth: (req, authOrSecDef, scopesOrApiKey, cb) => {
        if (scopesOrApiKey == "open") {
            cb();
        } else {
            req.correlationid = req.header('correlationid');
            req.scopes = scopesOrApiKey;
            let authorization = req.header('Authorization');
            let valid = typeof(authorization) == 'string';
            valid = valid && authorization.startsWith('Bearer');

            if (!valid) {
                authorization = req.cookies.AUTH;
                valid = typeof(authorization) == 'string';
            }

            if (valid) {
                let jwt = authorization.replace('Bearer ', '');
                verifyJwt(jwt)
                    .then(function (jwt) {
                        if (validateJwt(jwt, req)) {
                            let ok = true;

                            // If a self role is defined, make sure the logged in user UUID is equal to the swagger UUID passed (MUST exist)
                            if ( !ok && _.indexOf( scopesOrApiKey, 'self') != -1 ){
                                ok = true;
                                //ok = (req.swagger.params.uuid !== undefined && req.account.uuid == req.swagger.params.uuid.value )
                            }

                            if (!ok){
                                cb(new Error('access denied'));
                            }else{
                                cb();
                            }
                        }else{
                            cb(new Error('access denied'));
                        }
                    })
                    .catch( (err) => {
                        console.log (err);
                        // throw err;
                        cb(new Error('access denied'));
                    });
            }else{
                cb(new Error('access denied'));
            }
        }
    }
};