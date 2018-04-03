'use strict';

const jwt = require('./jwt');

function intersect(a, b) {
    return [...new Set(a)].filter(x => new Set(b).has(x));
}

function validateJwt(jwt, req){
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
        if (scopesOrApiKey == 'open') {
            cb();
        } else {
            req.correlationid = req.header('correlationid');
            req.scopes = scopesOrApiKey;
            let authorization = req.header('Authorization');
            let valid = typeof(authorization) == 'string';
            valid = valid && authorization.startsWith('Bearer');

            if (!valid) {
                authorization = req.cookies.SENTINEL_AUTH;
                valid = typeof(authorization) == 'string';
            }

            if (valid) {
                let j = authorization.replace('Bearer ', '');
                jwt.verify(j)
                    .then(function (j) {
                        if (validateJwt(j, req)) {
                            let ok = true;

                            let now = Math.trunc(((new Date).getTime() / 1000));

                            if (now >= j.exp) {
                                return cb(new Error('token has expired'));
                            }

                            let i = intersect( scopesOrApiKey, j.role.split(',') );

                            ok = ok && ( i.length > 0 );

                            if (!ok){
                                cb(new Error('access denied (scopes)'));
                            }else{
                                cb();
                            }
                        }else{
                            cb(new Error('access denied (invalid jwt)'));
                        }
                    })
                    .catch( (err) => {
                        console.log (err);
                        // throw err;
                        cb(new Error('access denied (error)'));
                    });
            }else{
                cb(new Error('access denied (invalid)'));
            }
        }
    }
};