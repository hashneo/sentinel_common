'use strict';

function PubSub(options){

    const path = require('path');

    if (!(this instanceof PubSub)) {
        return new PubSub(options);
    }

    const gcloud = require('gcloud');

    const pubsub = gcloud.pubsub({
        projectId: 'sentinel',
        keyFilename: path.normalize( path.resolve( __dirname, '..', 'config', 'gc.json' ) )
    });

    var currentTopics = {};

    this.createTopic = (topic) => {

        return new Promise( ( fulfill, reject ) => {

            let t = pubsub.topic(topic);

            t.exists( (err, exists) => {

                if (err){
                    reject(err);
                    return;
                }

                if ( !exists){
                    t.create(function(err, t){
                        if (err)
                            throw err;
                        currentTopics[topic] = t;

                        fulfill();
                    });
                }else{
                    currentTopics[topic] = t;
                    fulfill();
                }
            });
        });

    };

    this.addSubscription = ( topic, name, callback ) => {

        if ( currentTopics[topic] === undefined ){
            this.createTopic( topic )
            .then( () => {
                return this.addSubscription( topic, name, callback );
            });
        }

        return new Promise( ( fulfill, reject ) => {
            currentTopics[topic].subscribe(name, {reuseExisting: true}, function (err, subscription) {

                if (err) {
                    reject(err);
                    return;
                }

                subscription.on('message', (message) => {
                    try {
                        callback(message);
                        //message.ack(callback);
                    }
                    catch (err) {
                        console.log(err.message);
                    }
                });

                fulfill();
            });
        });

    };

    this.publish = ( topic, data ) => {
        if ( currentTopics[topic] === undefined ){
            this.createTopic( topic )
            .then( () => {
                return this.publish( topic, data );
            });
        }

        return new Promise( ( fulfill, reject ) => {
            currentTopics[topic].publish( { data }, (err, messageIds) => {

                if (err){
                    reject(err);
                    return;
                }

                fulfill( messageIds );
            });
        });

    }
}

module.exports = new PubSub;