var express = require('express');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session')

var app = express();
app.use(cookieSession({
  name: 'playerSession',
  keys: ['1234', '2345', '3456'],
}));

var http = require('http').Server(app);
var io = require('socket.io')(http);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


var dbName = 'antSystem.db';

var database = require( __dirname + '/core/database.js');
var playerController = require( __dirname + '/core/playerController.js');
var adminController = require( __dirname + '/core/adminController.js');


database.initDB();

// racine : selection d equipe
app.get('/', function(req, res){

// check for active game :
    playerController.getActiveGame(function(results){
        if(results.length){

            var game = results[0];

            if(req.param('playerId') && req.param('teamId') ){
                //if(req.param('playerId') ){

                    req.session.teamId = req.param('teamId');
                    req.session.playerId = req.param('playerId');
                    req.session.gameid = game.rowid;
                    res.redirect('/');

            }


            switch(game.status){

            case "pending":
                playerController.showPlayScreen(game,'pending',req,res);
                break;
            case "stop":
                playerController.showPlayScreen(game,'stop',req,res);
                break;
            case "play":
                 playerController.showPlayScreen(game,'play',req,res);
                 break;
            case "pause":
                playerController.showPlayScreen(game,'pause',req,res);
                break;

            };



        }
        else
            res.render('player/nogame.ejs', {'session':req.session, 'team': {}, 'game' : {} ,'score': {}});
    });

});

app.get('/reset', function(req, res){
        //reset Session;
       // var playerId = req.session.playerId;
        req.session = null;
        res.redirect('/');

    });


app.get('/getTime', function(req, res){

        if(req.query.gameid){

            playerController.getTime(req.query.gameid, function(timeData){
                res.json(timeData);
            });

        }else
        res.status(500).send('No game Id !');



    });

app.get('/getGame',function(req, res){



        playerController.getActiveGame(function(gameData){

            res.json(gameData[0]);
        });




});



app.get('/giveAnswer',function(req, res){

        playerController.getActiveGame(function(gameData){

            var AnswerStatus = playerController.checkAnswer(req.session.teamId,req.session.playerId,req.query.missionId,req.query.objId,req.query.answer,gameData[0]);

            res.json({status: AnswerStatus});



        });




});





// Go to Admin page
app.get('/admin', function(req, res){

        playerController.getActiveGame(function(results){
            if(results.length){

                var game = results[0];
                res.render('admin/current', {'game': game });
            }else{
            res.render('admin/games', { });
            }

        });


});

app.get('/admin/games', function(req, res){

    //sendGameList();


    var targetPage = 'admin/games';

    if(req.query.gameid){
         res.redirect('admin/gameDetails');
    }

 res.render(targetPage,{});

});

app.get('/admin/details', function(req, res){

    if(req.query.gameid)
        res.render('admin/gameDetails',{"gameid": req.query.gameid});
    else
        res.redirect('/admin/games');
});




app.get('/admin/getGames', function(req, res){

    var whereStatement = "";

     if(req.query.gameid) whereStatement = 'rowid = ' + req.query.gameid;
     var query = ""


    database.runRequest('select',{table : 'game', col : ['rowid','*'], where : whereStatement},function(results){

    res.json(results)

            });

});

app.get('/admin/setStatus', function(req, res){

       if(req.query.gameid && req.query.status){
            if(req.query.status == 'restart')
                adminController.restartGame(req.query.gameid);
            else
                adminController.changeGameStatus(req.query.gameid,req.query.status);

       }
       io.emit('status-change',{});
       res.redirect('/admin/');

   });


app.get('/admin/setTime', function(req, res){
    if(req.query.gameid && req.query.time){
        adminController.setTime(req.query.gameid,req.query.time,function(){
        io.emit('time-change',{});
        });

    }
    res.redirect('/admin/');



});


app.get('/admin/scenarios', function(req, res){

    sendGameList();

    res.render('admin/scenarios', { });

});



var displayTeamPage = function(team,res){

	res.render('team',{
        team: team});
	
};


    var sendGameList = function(){

        database.runRequest('select',{table : 'game', col : ['rowid','*'], where : ''},function(results){

                io.emit('gameList', results);
            });

    };





//definition des sockets utilisées
var sqlite3 = require('sqlite3').verbose();

io.on('connection', function(socket){


// add a new game
socket.on('adminAddGame', function(data){
    var typeRequest = "update";
    var gameData = data['game'];
    var whereStatement = "";

    if(!gameData.rowid) {
        typeRequest = "insert";
    } else {
        whereStatement = "rowid = " + gameData.rowid;
    }
    database.runRequest(typeRequest,{table:"game",
        where : whereStatement,
        col :{"name" : gameData.name,
            "map": gameData.map,
            "teams": JSON.stringify(gameData.teams),
            "duration": gameData.duration,

            "missions": JSON.stringify(gameData.missions),
            "creationDate":Date.now()
            }
        },
        function(){
            //sendGameList();
        });


});



// get game list

    socket.on('gameList', function(){
        sendGameList();
    });

    socket.on("score-update",function(){

         io.emit('time-change',{});
    });



    socket.on('toggleActive', function(data){



            if(data.active == 1) {
            database.runRequest('update',{table : 'game', col : {"active":"0"}},function(){ sendGameList();});

            }
            active =  data.active;

            database.runRequest('update',{table : 'game', col : {"active":active} , where : 'rowid = '+ data.gameid},function(){
            sendGameList();

            io.emit('status-change',{});
        });




    });

    socket.on('removeGame', function(id){
         database.runRequest('delete',{table : 'game', where : 'rowid = '+ id},function(){
                sendGameList();
            });

    });



});





http.listen(3000, function(){
  console.log('listening on *:3000');
});



