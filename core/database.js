// DB tools
	var sqlite3 = require('sqlite3').verbose();
    var dbName = 'antSystem.db';



var connectDB = function (){

            return new sqlite3.Database(dbName);
}

/*
    request data format :
    { table : "tablename" , col : ['colname1','colname2'...], where : "where id = lol"}

*/


var selectRequest = function (data,callback) {

        var db = connectDB();

        var results = [];

        var whereStatement = '';
        if(data.where)whereStatement = " WHERE "+ data.where;
        var colList = data.col.join();

        var query = "SELECT "+ colList +" from " + data.table + " "+ whereStatement + ";";

        db.each(query,
            function(err, row) {
                if(err)console.log(err);
                results.push(row);
            }, function () {

                    callback(results);
            }
        );
        db.close();

};


var updateRequest = function (data,callback) {

     var db = connectDB();
     var query ="";
     var results = [];
     var whereStatement ="";

     console.log(JSON.stringify(data));

     if(data.where ) whereStatement ="WHERE " + data.where;
     var setList = [];

    for(key in data.col){
    setList.push(key + " = '"+data.col[key]+"'");

    }

    query = "update game set "+setList.join()+" "+ whereStatement +";"

    console.log("QUERY UPDATE :  "+ query);

    db.run(query,function(err,row){
             if(err) console.log("ERROR : " + err);

    callback()});
    db.close();

};

var insertRequest = function (data,callback) {

    var db = connectDB();
    var query ="";
    var results = [];

    var whereStatement =""
    var colList =[];
    var valueList = [];

    for(key in data.col){
        colList.push(key);
        valueList.push(data.col[key]);
    }
    query = "insert into game ("+ colList.join() +") VALUES ('"+valueList.join("','")+"'); ";

    console.log("QUERY :  "+ query);

     db.run(query,function(err,row){
        if(err) console.log(err);
        callback()
     });


     db.close();


};

var deleteRequest = function (data,callback) {

    var db = connectDB();

    var whereStatement = data.where;


    var query = "DELETE from "+data.table + " WHERE " + whereStatement + ";" ;

    db.run(query, function(){
    callback();
    });


     db.close();


};





module.exports = {


        runRequest : function(type,data,callback){

            switch(type){
                case 'select' :
                    selectRequest(data,function (results){callback(results)});
                    break;

                case 'update' :
                    updateRequest(data,function (results){callback(results)});
                    break;

                case 'insert' :
                    insertRequest(data,function (results){callback(results)});
                    break;

                case 'delete' :
                    deleteRequest(data,function (results){callback(results)});
                    break;

            };



        },

        adminGetGames : function(gameid,callback){

                var db = new sqlite3.Database(dbName);
        		var results = {"games" : []};
        		var whereStatement ="";
        		if(gameid) whereStatement = "WHERE rowid = "+gameid+";";



        		var query = "SELECT rowid,name,map,status,startDate,teams,(select count(rowid) from missions where idgame = rowid) as missions from game"+ whereStatement + ";";


                db.each(query,
              			function(err, row) {
               				results["games"].push({'id' : row.rowid,
               				 'name' : row.name,
               				 'map' : row.map,
               				 'status' : row.status,
               				 'startDate' : row.startDate,
               				 'teams' : row.teams,
               				 'missions' : row.missions,

               				 });
              			}, function () {
                                callback(results);
              			}
            		);
                db.close();
        },




        getActiveGame : function(callback){
            var db = new sqlite3.Database(dbName);
            var activeGame = {"activeGame" : []};
            db.serialize(function() {
                db.all("SELECT * from game where status='active';",
                    function(err, row){
                        activeGame["activeGame"].push({'id' : row.rowid, 'name' : row.name});
                    }, function () {
                        callback(activeGame);
                    });
            });
            db.close();

        },



        toggleStatus : function(id,callback){
         var db = new sqlite3.Database(dbName);
            db.serialize(function() {
            db.run("update game set status='pending';");

            // TODO : check si c est deja actif et desactive si c est le cas !
            db.all("select status from game where rowid = "+ id + ";" , function(err,row){
                    console.log(JSON.stringify(row));

                    db.run("update game set status = 'active' where rowid = "+ id + ";", function(){
                                callback();
                    });
            },function(){

                callback();

            });


            });
        db.close();
        },

        removeGame : function(id,callback){
                var db = new sqlite3.Database(dbName);

                db.run("delete from game where rowid = "+ id + ";", function(){
                callback();
                });


                db.close();
         },



        initDB : function (){

            db = connectDB();
            var check;
            console.log("initDB ");
            db.serialize(function() {

            // init game table
            /*
             name : nom de la partie
             map : URL de la carte
             creationDate : date de création
             active : partie active ou non 0 ou 1
             status : statut de la partie
             startDate : date et horaire de départ
             Teams : JSON des equipes
             missions : JSON des missions
             duration : duree de partie en min
             */

             db.run("CREATE TABLE if not exists game(name TEXT NOT NULL,map TEXT, creationDate DATE,active INT, status TEXT,teams TEXT, missions TEXT, duration INT);");

             // init scenario table

             /*
             name : nom du scenario
             objectives : objectifs du scenarios et réponses (JSON)
             map : coordonnées des objectifs (JSON)
             description : texte d'intro/description de l'objectifs
             creationDate : date de création
              */
             db.run("CREATE TABLE if not exists scenario(name TEXT NOT NULL,objectives TEXT, map TEXT, description TEXT, creationDate Date);");

             // init missions table
             /*
                idgame : identifiant de la partie a qui appartient ce scenario
                name : nom du scenario
                objectives : objectifs du scenarios et réponses (JSON)
                map : coordonnées des objectifs (JSON)
                description : texte d'intro/description de l'objectifs
                start : horaire de départ (relatif au début de partie) en minutes
                end : horaire de fin (en min)
                status : statut du scenario - success, failed, running

             */

             db.run("CREATE TABLE if not exists missions(idgame INT NOT NULL,name TEXT NOT NULL,objectives TEXT, map TEXT, start NUMERIC, end NUMERIC, description TEXT, status TEXT);");

             // init gameLog table
             /*
                idgame : identifiant de la partie
                player : identifiant du joueur
                action : type d'action
                status : status de l'action
                dateaction : date relative de l'action (en min)
             */
             db.run("CREATE TABLE if not exists gamelog(idgame INT NOT NULL,player TEXT, action TEXT, status TEXT, dateaction NUMERIC);");


            });

            db.close();


        },

        connectDB : function(){

        return connectDB();

        },



		

		
	}





