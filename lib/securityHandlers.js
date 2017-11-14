'use strict';

const jose = require('node-jose');

var rp = require('request-promise');

const keystore = jose.JWK.createKeyStore();
const _ = require('underscore');

var signatureKey;

function loadPublicKey() {

    let options = {
        uri: 'https://koo.io/api/v1/auth/publickey',
        rejectUnauthorized: false,
        json: true
    };

    rp(options)
        .then((signature) => {
            keystore.add(signature, 'pem')
                .then(function (result) {
                    signatureKey = result;
                })
                .catch(function (e) {
                });
        })
        .catch((err) => {
            console.log(err);
            setTimeout(loadPublicKey, 5000);
        });
}

setTimeout(loadPublicKey, 1000);

function verifyJwt(jwt) {

    return new Promise( function (fulfill, reject) {

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
    if ((typeof(jwt['acc_id']) == "string")) {
        req.account = {
            uuid: jwt['acc_id'].toLowerCase()
        };

        if ( jwt['employer_id'] !== undefined ) {
            req.employer = {
                employee : { uuid: jwt['employee_id'].toLowerCase() },
                uuid: jwt['employer_id'].toLowerCase()
            };
        }
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
            let valid = typeof(authorization) == "string";
            valid = valid && authorization.startsWith("Bearer");

            if (!valid) {
                authorization = req.cookies.AUTH;
                valid = typeof(authorization) == "string";
            }

            if (valid) {
                let jwt = authorization.replace("Bearer ", "");
                verifyJwt(jwt)
                    .then(function (jwt) {
                        if (validateJwt(jwt, req)) {
                            let ok = false;

                            // if a student role is defined, check that the employer IS NOT logged in
                            ok = ok || (_.indexOf( scopesOrApiKey, 'student') != -1 && (req.employer === undefined));

                            // if a employee role is defined, make sure an employer IS logged in
                            ok = ok || (_.indexOf( scopesOrApiKey, 'employee') != -1 && (req.employer !== undefined));

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
                        throw err;
                        //cb(new Error('access denied'));
                    });
            }else{
                cb(new Error('access denied'));
            }
        }
    }
};