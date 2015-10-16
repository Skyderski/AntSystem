var express = require('express');
var app = express();
var http = require('http').Server(app);

var database = require( '../core/database.js');
var playerController = require( '../core/playerController.js');
var io = require('socket.io')(http);


module.exports = {


    restartGame : function(gameid){


         database.runRequest('update',{
                    table : 'game',
                    col : {"status":'pending'},
                    where : 'rowid = '+ gameid
                    },function(){

                    database.runRequest('delete',{
                         table : 'gamelog',
                         where : 'gameid = '+ gameid
                         },function(){});


                        console.log("reset game !");
                    });

    },


    changeGameStatus: function(gameid,status){

        database.runRequest('update',{
            table : 'game',
            col : {"status":status},
            where : 'rowid = '+ gameid
            },function(){



                playerController.log({
                    'gameid':gameid,
                    'type':'time',
                    'action':status
                },function(){});

                io.emit('status-change',{});


            console.log(status+ " game "+ gameid +"!");
            });


    },

    setTime: function(gameid, timeInMin,callback){
        // search remove in log all time actions and set new one

        var startDate = Date.now() - (parseInt(timeInMin) * 60 * 1000 );
        database.runRequest('delete',{
                                 table : 'gamelog',
                                 where : 'gameid = '+ gameid + " AND type='time'"
         },function(){


         playerController.log({
                             'gameid':gameid,
                             'type':'time',
                             'action':'play',
                             'actionDate':startDate,
                         },function(){
                         callback();
                         });


         });





    },





}