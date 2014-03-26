/**
 * Created by smclean on 3/25/14.
 */

cheerHub = require('./cheer');

exports.initializeHubs = function(io){
    cheerHub.initialize(io);
};