"use strict";

const jwtDecode = require('jwt-decode');

function auth() {

    let request = require('request');

    const jwt = require('./jwt');

    let that = this;

    let cache = {};

    this.login = ( host, data ) => {

        return new Promise( (fulfill, reject)=>{

            if ( cache[host] && cache[host][data.email] ){
                let jwt = cache[host][data.email];

                let decoded = jwtDecode(jwt);

                let now = Math.trunc(((new Date).getTime() / 1000));

                // jwt is still valid
                if ( (now + 10) < decoded.exp ) {
                    return fulfill( jwt );
                }
            }

            let j = request.jar();

            request = request.defaults({jar: j});

            let options = {
                url: host + '/api/auth/login',
                method: 'POST',
                json: data
            };

            request(options, (err, resp, body) => {

                if (err)
                    return reject(err);

                if ( resp.statusCode !== 200 )
                    return reject(body);

                let cookies = j.getCookies(host);

                cookies.forEach( (cookie) => {
                    if ( cookie.key === 'SENTINEL_AUTH' ) {
                        if (!cache[host])
                            cache[host] = {};
                        cache[host][data.email] = cookie.value;
                        console.log(`new token =>${cookie.value}`);
                        return fulfill(cookie.value);
                    }

                });

                reject(new Error('no AUTH cookie returned'));
            });

        });
    }

}

module.exports = new auth();