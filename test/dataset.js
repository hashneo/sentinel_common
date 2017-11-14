'use strict';

var request = require('supertest');
const swaggerParser = require('swagger-parser');
var assert = require('chai').assert;
var diff = require('deep-diff').diff;

describe('dataset', function() {

    let db = require( '../index').db;
    let collection;

    before(function() {
        // runs before all tests in this block
    });

    after(function() {

    });

    beforeEach(function() {
        // runs before each test in this block
    });

    afterEach(function() {
        // runs after each test in this block
    });

    // test cases
    describe('Document Store', function(){

        let data = {
            a : 1,
            b : {
                c : 2,
                d : {
                    e : 3
                }
            }
        };

        let id;

        describe('Create Test Collection', function(){
            it('should create a test collection', function(done){
                try{
                    collection = db.createCollection('test');
                    done();
                }
                catch(err){
                    done(err);
                }
            });
        });

        describe('Insert Document into a tenant', function(){
            it('should insert correctly', function(done){
                collection.insert('a-b-c', data)
                    .then( (doc) => {
                        data = doc;
                        done();
                    })
                    .catch( (err) => {
                        done(err);
                    });
            });
        });

        describe('Find Document using tenant', function(){
            it('should find the document and should be the same', function(done){
                collection.find('a-b-c', data.id)
                    .then( (doc) => {
                        if (doc) {
                            var differences = diff(data, doc[0]);
                            if ( differences )
                                done('data <> returned doc \nsource => ' + JSON.stringify(data,null, '  ') + ' \n result => ' + JSON.stringify(doc[0],null, '  '));
                            else
                                done();
                        }
                        else
                            done('document was not found');
                    })
                    .catch( (err) => {
                        done(err);
                    });
            });
        });

        describe('Find Document using another tenant', function(){
            it('should not find the document', function(done){
                collection.find('c-b-a', data.id)
                    .then( (doc) => {
                        if (!doc)
                            done();
                        else
                            done('document was found');
                    })
                    .catch( (err) => {
                        done(err);
                    });
            });
        });

        describe('Delete Document', function(){
            it('should not find the document', function(done){
                collection.delete('a-b-c', data)
                    .then( () => {
                        done();
                    })
                    .catch( (err) => {
                        done(err);
                    });
            });
        });

        describe('Drop Collection', function(){
            it('should be gone', function(done){
                collection.drop()
                    .then( () => {
                        done();
                    })
                    .catch( (err) =>{
                       done(err);
                    });
            });
        });

    });

});