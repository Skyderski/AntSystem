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

database.initDB();

// racine : selection d equipe
app.get('/', function(req, res){

// check for active game :
    playerController.getActiveGame(function(results){
        if(results.length){
            if(req.param('playerId') && req.param('teamId') ){
            //if(req.param('playerId') ){

                req.session.teamId = req.param('teamId');
                req.session.playerId = req.param('playerId');
                req.session.gameid = results[0].rowid;
                res.redirect('/');
            }else if(req.session && req.session.hasOwnProperty('playerId')){


                var game = results[0];
                var team = game.teams[req.session.teamId];




                console.log(JSON.stringify(req.session));
                res.render('player/currentGame.ejs', {'session':req.session, 'team': team, 'game' : game });
            }
            else{
                console.log(JSON.stringify(req.session));
                console.log(JSON.stringify(results[0].teams));
                res.render('player/teamChoose.ejs', {'teams':JSON.parse(results[0].teams)});
            }

        }
        else
            res.render('player/nogame.ejs', { });
    });

});

app.get('/reset', function(req, res){
        //reset Session;

        req.session = null;
        res.redirect('/');

    });




// Go to Admin page
app.get('/admin', function(req, res){

    sendGameList();

    res.render('admin/current', { });

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
var gameInfo = { game: "novembre", status: "standby"};

io.on('connection', function(socket){


// add a new game
socket.on('adminAddGame', function(data){
    console.log('adminAddGame');
    var typeRequest = "update";
    var gameData = data['game'];
    var whereStatement = "";
    console.log("gameid : " + JSON.stringify(gameData));

    if(!gameData.rowid) {
        typeRequest = "insert";
    } else {
        whereStatement = "rowid = " + gameData.rowid;
    }
    console.log(typeRequest);
    database.runRequest(typeRequest,{table:"game",
        where : whereStatement,
        col :{"name" : gameData.name,
            "map": gameData.map,
            "teams": JSON.stringify(gameData.teams),
            "duration": gameData.duration,
            "active" : '0',
            "status": 'stopped',
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



    socket.on('toggleActive', function(data){



            if(data.active == 1) {
            database.runRequest('update',{table : 'game', col : {"active":"0"}},function(){ sendGameList();});

            }
            active =  data.active;

            database.runRequest('update',{table : 'game', col : {"active":active} , where : 'rowid = '+ data.gameid},function(){
            sendGameList();

            io.emit('activation',{});
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



