var module = {};
var currentTime = -1;
var currentStatus;
var gameId;
var timeStep = 1 * 60 * 1000;
var timer;
var game;
var logScore = {};


$( document ).ready(function() {

     var socket = io();
     socket.on("status-change", function(data){
            console.log("STATUS CHANGE");
               // module.playerPage.updateDisplay();
                location.reload();
           });
      socket.on("time-change", function(data){
          console.log("TIME CHANGE");
             module.playerPage.updateDisplay();

         });

    module.playerPage.init();

});



module.playerPage = {


        init : function(){

                    module.playerPage.setEvent();
                    if(currentStatus=="pause")$('.pause-modal').show();
                    else $('.pause-modal').hide();
                    module.playerPage.updateDisplay();
                    timer=setInterval(function() {module.playerPage.updateDisplay()}, timeStep);



        },

         setEvent: function(){


             $('body').on('click', '.reset-player', function() {

                  if(confirm("Etes-vous certain de changer d'équipe ? ")){
                    window.location.href="/reset";

                  }

             });


             $('body').on('click', '.btn-mission.is-active', function() {


                $('.'+$(this).attr('data-target')).modal('show');


             });

             $('body').on('submit', '.obj-form', function() {


                    $(this).addClass('disabled');
                    var currentInput = $(this);
                    var answer = $(this).find('.obj-answer-input').val();
                    var missionId = $(this).find('.obj-answer-input').attr("mission-id");
                    var objId = $(this).find('.obj-answer-input').attr("obj-id");



                    module.playerPage.giveAnswer(gameId, missionId, objId, answer,function(data){

                        currentInput.parent().removeClass('has-error').removeClass('has-warning');
                        currentInput.parent().addClass('has-feedback');
                        currentInput.parent().addClass('has-'+data.status)
                        currentInput.parent().find('.obj-error-msg').html(data.msg);
                        currentInput.removeClass('disabled');

                        return false;

                    });


             });







        },

        vibrate: function(){
            navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
            console.log('vibrate !');
            if (navigator.vibrate) {

                navigator.vibrate([500, 300, 300, 300, 500]);
            	// vibration API supported
            }

        },

        updateChrono: function(gameid,callback){

            $.getJSON( "/getTime?gameid="+gameId, function( data ) {

                   currentTime = parseInt(data)/timeStep;

                   $('.timer-value').html(("00" + parseInt(currentTime )).slice(-3));

                   callback();

                }).fail(function() {

                    currentTime += 1;
                    console.log( "unable to connect to server" );
                    $('.timer-value').html(("00" + parseInt(currentTime )).slice(-3));
            });




        },


        updateModal: function(missionDiv, mission){

            missionDiv.find('.mission-modal').addClass("mission-"+mission.id+"-modal");

            missionDiv.find('.modal-title').html(mission.name)

            missionDiv.find('.mission-desc').html(mission.desc)

            missionDiv.find('.btn-mission').attr('data-target',"mission-"+mission.id+"-modal");

            missionDiv = module.playerPage.displayObjectives(missionDiv,mission);



        return missionDiv;
        },

        displayObjType: function(type){

            var typeHtml="";
            console.log(type);
            switch(type){

            case "waypoint":
                typeHtml="<span class='glyphicon glyphicon-map-marker'></span>";
                break;
            case "step":
                typeHtml="<span class='glyphicon glyphicon-play'></span>";
                break;
            case "collect":
                typeHtml="<span class='glyphicon glyphicon-eject'></span>";
                break;
            case "end":
                typeHtml="<span class='glyphicon glyphicon-step-forward'></span>";
                break;
            case "timeStep":
                typeHtml="<span class='glyphicon glyphicon-time'></span>";
                break;
            case "team1":
                typeHtml="<span class='glyphicon glyphicon-play'></span>";
                break;
            case "team2":
                typeHtml="<span class='glyphicon glyphicon-play'></span>";
                break;


            };

            return typeHtml;

        },

        displayObjectives: function(missionDiv, mission){

            var objectives = mission.objectives;
            var currentScore = 0
            missionDiv.find('.mission-obj').empty();

            for(index in objectives){

                var $clone = $('.objective-pattern').clone(true,true).removeClass('objective-pattern hidden');
                var objectiveComplete = false;
                var currentObj = objectives[index];

                $clone.find('.obj-type').append(module.playerPage.displayObjType(currentObj.missionObjectivesType));

                $clone.find('.obj-desc').append(currentObj.missionObjectivesDesc);

                if(currentObj.missionObjectivesQuestion){
                    $clone.find('.obj-question').append(currentObj.missionObjectivesQuestion);

                }else{
                $clone.find('.obj-question-line').hide();

                }

                $clone.find('.obj-answer-input').attr('mission-id',mission.id).attr('obj-id',currentObj.missionObjectivesId);

                if(logScore[currentTeam])
                    if(logScore[currentTeam][mission.id])
                        if(logScore[currentTeam][mission.id][currentObj.missionObjectivesId]=="success"){
                                $clone.find('.obj-line').addClass("success");
                                $clone.find('.obj-success-msg').removeClass("hide");

                                $clone.find('.obj-question-line').hide();
                                objectiveComplete = true;


                        }

                        var relativeStart = parseInt(mission.start);
                        if(currentObj.missionObjectivesStart) relativeStart+= parseInt(currentObj.missionObjectivesStart);
                        console.log("relative start = " + relativeStart + " currentTime : " + currentTime);


                // gestion des etapes avec délais

                if(currentObj.missionObjectivesType=="timeStep" && relativeStart > parseInt(currentTime)){

                 $clone.find('.obj-question-line').hide();
                 $clone.find('.obj-desc').html("Suite dans "+(relativeStart - parseInt(currentTime)) + " minutes");

                  missionDiv.find('.mission-obj').append($clone);
                 break;
                }

                if(currentObj.missionObjectivesType=="end" && objectiveComplete==true){
                    missionDiv.find('.progress-bar').attr('style','width: 100%;').html("SUCCESS");
                    missionDiv.find('.btn-mission').addClass("disabled");
                 }


                // cas d'un Step non accompli
                if(currentObj.missionObjectivesType=="step" && objectiveComplete==false)
                    break;
                else
                    missionDiv.find('.mission-obj').append($clone);






            }


        return missionDiv;
        },



        getTotalScoreForMission(mission){

          var objectives = mission.objectives;
          var totalScore = 0;
          var currentScore = 0;

          for(index in objectives){

            totalScore+= parseInt(objectives[index].missionObjectivesScore);

            if(currentTeam && logScore[currentTeam] && logScore[currentTeam][mission.id] && logScore[currentTeam][mission.id][objectives[index].missionObjectivesId] == "success" ){
                    currentScore += parseInt(objectives[index].missionObjectivesScore);

            }

          }


          return {"current": currentScore, 'total' : totalScore};

        },

        getMissionTimeDisplay: function(missionDiv, mission){

        //create time bar
            var minutesLeft = mission.end - (currentTime);
             var percentCompleted  = 100 *(minutesLeft)/(mission.end-mission.start);

            missionDiv.find('.progress-bar').attr('aria-valuenow',currentTime)
                .attr('aria-valuemin',mission.start)
                .attr('aria-valuemax',mission.end)
                .attr('style','width: '+percentCompleted+'%;');
            missionDiv.find('.used').attr('style','width: '+(100 -percentCompleted)+'%;');

            if(percentCompleted>50)
                missionDiv.find('.progress-bar.left').html(("00" + parseInt(mission.end - currentTime )).slice(-3)+"min left");
            else
                missionDiv.find('.used').html(("00" + parseInt(mission.end - currentTime )).slice(-3)+"min left");


        return missionDiv;
        },

        updateMissionTimeDisplay: function(missionDiv,mission){

            //init
            missionDiv.find('.progress-bar').removeClass('progress-bar-success')
                .removeClass('progress-bar-danger')
                .removeClass('progress-bar-striped');

            missionDiv.removeClass("disabled");


            // set up
            if(mission.start > currentTime){
                // future time
                var minutesToStart = ("00" + parseInt(mission.start - (currentTime) )).slice(-3) ;
                 missionDiv.find('.progress-bar.left')
                 .attr('style','width: 100%;')
                 .html("STARTS IN "+minutesToStart+" MIN");

                 missionDiv.addClass("disabled");

            }else if (mission.end > currentTime){
                //active
                var minutesLeft = mission.end - (currentTime);
                var percentCompleted  = 100 *(minutesLeft)/(mission.end-mission.start);

                missionDiv.find('.progress-bar')
                    .addClass('progress-bar-success')
                    .attr('aria-valuenow',currentTime)
                    .attr('aria-valuemin',mission.start)
                    .attr('aria-valuemax',mission.end)
                    .attr('style','width: '+percentCompleted+'%;');

                missionDiv.find('.used').attr('style','width: '+(100 -percentCompleted)+'%;');

                if(percentCompleted>50){
                    missionDiv.find('.progress-bar.left').html(("00" + parseInt(mission.end - currentTime )).slice(-3)+"min left");
                    missionDiv.find('.used').html("");
                    }
                else{
                    missionDiv.find('.used').html(("00" + parseInt(mission.end - currentTime )).slice(-3)+"min left");
                    missionDiv.find('.progress-bar.left').html("");
                }


            }else if (mission.end < currentTime){
                //over
                missionDiv.addClass("disabled");
                missionDiv.find('.progress-bar')
                        .addClass('progress-bar-danger')
                        .addClass('progress-bar-striped')
                        .attr('style','width: 100%;')
                        .html("OVER");
            }

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

        giveAnswer(gameId, missionId, objId, answer,callback){

            $.getJSON( "/giveAnswer", { 'gameId': gameId,
                'missionId' : missionId,
                 'objId' : objId,
                 'answer' : answer})
              .done(function( data ) {
                console.log( "Data Loaded: " + JSON.stringify(data) );
                if(data.status=="fail")
                    callback({"status" : "error", 'msg' : "Réponse incorrecte !"}) ;
                if(data.status=="error")
                                    callback({"status" : "error", 'msg' : "Erreur serveur - manque des données"}) ;
                if(data.status=="success"){
                        socket.emit("score-update");
                }

              })
              .fail(function(error){

                if(error.status == 0){
                    console.log("connexion lost");
                    callback({"status" : "warning", 'msg' : "Connexion perdue, essayez plus tard"}); ;

                }else{
                    console.log("ERREUR : " + JSON.stringify(error));
                        callback({"status" : "error", 'msg' : "Erreur serveur, veillez contacter un administrateur"}) ;

                }

              }).error();



        },


        createMissionDiv: function(mission){

            var $clone = $('.mission-pattern').clone(true,true);
            $clone.removeClass('mission-pattern');
            $clone.removeClass('hidden');
            $clone.addClass('mission-'+mission.id);
            $clone.find('.panel-title,.btn .mission-name').append(mission.name);
            // future :
            if(mission.start > currentTime){
            $clone.find('.btn-mission').removeClass('is-active');
                 $('.mission-future').append($clone);
            }
            // current
            if(mission.start < currentTime && mission.end > currentTime){
                $clone.find('.btn-mission').addClass('is-active');
                $('.mission-active').append($clone);
            }

            // over
            if(mission.end < currentTime){


                 $('.mission-over').append($clone);
            }

            module.playerPage.updateMissionDiv(mission);


        },

        updateMissionDiv: function(mission){

            var significantUpdate = 0;

            var $missionDiv = $('.mission-'+mission.id);

            var scores = module.playerPage.getTotalScoreForMission(mission);
            $missionDiv.find('.mission-score-total').html(scores.total);
            $missionDiv.find('.mission-score-current').html(scores.current);

            if(mission.start < currentTime && $missionDiv.parent().hasClass('mission-future')){
            // future mission become current
                $missionDiv.detach();
                 $missionDiv.find('.btn-mission').addClass('is-active');
                $('.mission-active').append($missionDiv);
                significantUpdate = 1;
            }
            if(mission.end < currentTime && $missionDiv.parent().hasClass('mission-active')){
            // current mission become over

                 $('.'+$missionDiv.find('.btn-mission').attr('data-target')).modal('hide');
                $missionDiv.detach();
                $missionDiv.find('.btn-mission').removeClass('is-active');
                $('.mission-over').append($missionDiv);
               // significantUpdate = 1;

            }
            if(mission.start < currentTime && mission.end > currentTime && $missionDiv.parent().hasClass('mission-over')){
            // over mission become current - tests only
                 $missionDiv.detach();
                  $missionDiv.find('.btn-mission').addClass('is-active');
                 $('.mission-active').append($missionDiv);
                 significantUpdate = 1;
            }
            if(mission.start > currentTime && ( $missionDiv.parent().hasClass('mission-over') || $missionDiv.parent().hasClass('mission-active')) ){
            //  mission become future again - tests only
                $('.'+$missionDiv.find('.btn-mission').attr('data-target')).modal('hide');
                 $missionDiv.detach();

                 $missionDiv.find('.btn-mission').removeClass('is-active');
                 $('.mission-future').append($missionDiv);
                // significantUpdate = 1;
             }


             module.playerPage.updateMissionTimeDisplay($missionDiv,mission);
             module.playerPage.updateModal($missionDiv,mission);



            return significantUpdate;
        },


        updateTotalScore: function(game){


            for(key in game.score){

                $('.score-team'+key).html(("00" + parseInt(game.score[key] )).slice(-2));
            }


        },

        updateAllMissionsScore: function(log){

        module.playerPage.parseLogForScore(log);

        /*
         // score update

                     var score = module.playerPage.getScoreForMission(mission);

                    $clone.find('.mission-score-current').html(score.currentScore);
                    $clone.find('.mission-score-total').html(score.totalScore);

        */


        },



        updateAllMissions: function(gameid){

            var isUpdated = 0;

            $.getJSON( "/getGame?gameid="+gameId, function( data ) {


                var missionsObject = JSON.parse(data.missions);

               // $('.mission-list').empty();
                // $('.mission-modal').modal();
                currentStatus = data.status;
                console.log(currentStatus);

                module.playerPage.updateTotalScore(data);
                logScore = module.playerPage.parseLogForScore(data.log);

                for(startTime in  missionsObject.timeline ){

                        missionsObject.timeline[startTime].forEach(function(missionId,index){

                            var currentMission = missionsObject.missions[missionId];
                            if(currentMission.team == 'both' || currentMission.team == 'team'+currentTeam ){


                                if($('.mission-list').find(".mission-"+missionId).length){
                                    isUpdated = module.playerPage.updateMissionDiv(currentMission);
                                    //update
                                }else{
                                    module.playerPage.createMissionDiv(currentMission);
                                    isUpdated = 1;
                                    //create
                                }



                                // creation du div

                            }



                        });

                        //module.playerPage.updateAllMissionsScore(data.log);




                };

                 if(isUpdated == 1) module.playerPage.vibrate();

            }).fail(function() {

                console.log( "unable to connect to server" );

             });


        },

        updateDisplay: function(){


        //update chrono puis missions


        module.playerPage.updateChrono(gameId, function(){module.playerPage.updateAllMissions(gameId)});


        },


};