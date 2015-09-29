
var database = require( '../core/database.js');


module.exports = {

        getActiveGame : function(callback){

            database.runRequest('select',{table : 'game', col : ['rowid','*'], where : 'active=1'},function(results){

                callback(results);

                        });



        },


};