
var database = require( '../core/database.js');


module.exports = {

        getActiveGame : function( callback){


            var whereStatement='active=1';

            //if(gameid!=null || gameid=='')whereStatement+=' AND rowid='+gameid;


            database.runRequest('select',{table : 'game', col : ['rowid','*'], where : whereStatement},function(activeGame){

                if(activeGame.length>0){
                    database.runRequest('select',{table : 'gamelog', col : ['rowid','*'], where : "gameid="+activeGame[0].rowid},function(gamelog){

                                    activeGame[0].log = gamelog;

                                    activeGame[0].score = module.exports.getScoreArray(gamelog);


                                    callback(activeGame);

                    });


                }else{
                    callback({});
                }



            });

        },

        getScoreArray: function(log){
            var score = {};

            log.forEach(function(line,index){

                if(line.type=="score" && line.action){

                    // TODO
                    var currentAction = JSON.parse(line.action);
                    if(currentAction.result == "success"){
                        if(!score[currentAction.team]) score[currentAction.team] = 0;

                          score[currentAction.team] += parseInt(currentAction.score);

                    }


                }


            })


        return score;
        },

        getTime: function(gameid,callback){

             var whereStatement = "type='time' and gameid = " + gameid +" order by actionDate";

             database.runRequest('select',{table : 'gamelog', col : ['rowid','*'], where : whereStatement},function(results){


                var gameTime = 0;
                var lastTimeStamp = 0;
                results.forEach(function(log, index){

                if(!lastTimeStamp || log.action=='play' ) lastTimeStamp=log.actionDate;
                else if(log.action=="pause"){
                    gameTime+= (parseInt(log.actionDate) - parseInt(lastTimeStamp));

                }
                if(index == (results.length-1) && log.action=='play')
                    gameTime+= (Date.now() - parseInt(lastTimeStamp));

                })
                callback(gameTime);

             });




        },

        getPlayerTeam : function(teamArray,teamId){

            var playerTeam = {};

            for(index in teamArray){

                var currentTeam = teamArray[index];

                if(currentTeam.id == teamId)
                    playerTeam = teamArray[index];



            }

        return playerTeam;

        },

        getScore: function(game, callback){

             var whereStatement = "type='score' and gameid = " + gameid +" order by actionDate";

             database.runRequest('select',{table : 'gamelog', col : ['rowid','*'], where : whereStatement},function(results){

                var allScores = {};
                results.forEach(function(log, index){


                });
                 callback(allScores);

             });

        },

        showPlayScreen : function(game,status,req,res){

            var pageDisplay = 'player/currentGame.ejs';
                    if(checkPlayerSession(req)){
                         var allTeams = JSON.parse(game.teams);

                        var playerTeam = module.exports.getPlayerTeam(allTeams,req.session.teamId);

                        var allMissions = getPlayerMission(req.session);
                        res.render('player/currentGame.ejs', {'session':req.session, 'team': playerTeam, 'game' : game , 'status' : status});
                    }
                    else{

                        res.render('player/teamChoose.ejs', {'teams':JSON.parse(game.teams)});
                    }

        },

        getObjective: function(game,missionId,objectiveId){

           return JSON.parse(game.missions).missions[missionId].objectives[objectiveId];

        },

        parseLogForScore: function(rawLog){

                    var log = {};

                    rawLog.forEach(function(value,index){

                    if(value.type=="score"){

                        var currentAction = JSON.parse(value.action);

                        if(currentAction.result=="success"){
                            if(!log[currentAction.team])log[currentAction.team]={};
                                if(!log[currentAction.team][currentAction.missionId])log[currentAction.team][currentAction.missionId]={};

                                log[currentAction.team][currentAction.missionId][currentAction.objectiveId]="success";
                        }
                    }
                    })
                return log;
        },


        checkAnswerAlreadyGiven: function(teamId,missionId,objectiveId,rawLog){

              var log = this.parseLogForScore(rawLog);
              if(log[teamId] && log[teamId][missionId] && log[teamId][missionId][objectiveId] == "success" )
                return true;
              else
                return false;

        },


        checkAnswer: function(teamId,playerId,missionId,objectiveId,answer,game){

            if(!teamId || !playerId || !missionId || !objectiveId)
                return 'error';


            var objective = this.getObjective(game,missionId,objectiveId);
            var teamValid = false;
            var alreadyGiven = this.checkAnswerAlreadyGiven(teamId,missionId,objectiveId,game.log);

            if(JSON.parse(game.missions).missions[missionId].team == "both" || JSON.parse(game.missions).missions[missionId].team == "team"+teamId) teamValid = true;

            var action = {
                "player" : playerId,
                'team' : teamId,
                'missionId' : missionId ,
                'objectiveId' : objectiveId,
                'score': objective.missionObjectivesScore,
            }


            if(answer.trim().toLowerCase()==objective.missionObjectivesAnswer.trim().toLowerCase() && teamValid ){
                 action.result = "success";

            }else{
                action.result = "fail";
            }
            if(!alreadyGiven )
                module.exports.log({
                                    'gameid': game.rowid,
                                    'type':'score',
                                    'action': JSON.stringify(action)
                             },function(){});


            return action.result


        },

         log: function(data,callback){

            if(!data.actionDate)
                data.actionDate = Date.now();


             database.runRequest('insert',{table:"gamelog",
                    col :data
                    },
                    function(){
                        callback();
                    });

         },








};

var getPlayerMission = function(){};
var checkPlayerSession = function(req){

                if(req.session && req.session.hasOwnProperty('playerId'))
                    return true;
                else
                    return false;

        };