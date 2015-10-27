var module = {};
var socket = io();




    module.gamesPage = {

    init: function(){
        // update nav bar
        $('#main-nav-bar li a').each(function(){
        if($(this).attr('href') == window.location.pathname )$(this).parent().addClass('active');

        });


        $.getJSON( "/admin/getGames", function( data ) {

        gameList = module.gamesPage.updateList(data,gameList);
        module.gamesPage.displayGameList();

        });

        module.gamesPage.setEvent();

        socket.on('gameList', function(data){
                       gameList = module.gamesPage.updateList(data,gameList);
                        module.gamesPage.displayGameList(gameList);
         });

    },

    setEvent: function(){

           // $('*').off( "click");

            //$( "#create-game" ).off("click");

            $( "#create-game" ).button().on( "click", function() {
               module.gamesPage.editGame('');
             });

             $( ".toggleBtn" ).button().on( "click", function() {

                 var active = 0;
                 if($(this).attr('active') == 0) active = 1;

                 var data = { 'gameid' : $(this).attr('gameid'), 'active' : active};
                 socket.emit('toggleActive',data);

                 return false;
             });

             $( ".supprBtn" ).button().on( "click", function() {
             if(window.confirm("Suppression ? "))
                 socket.emit('removeGame',$(this).attr('gameid'));
             });


             $('.editBtn').button().on( "click", function() {
                 module.gamesPage.editGame(gameList[$(this).attr('gameid')]);
             });

             $('.gameDetails').button().on( "click", function() {
                 module.gamesPage.editGame(gameList[$(this).attr('gameid')]);


             });




    },

    updateList : function(data,list){
            // reset list
        list = [];
        for(index in data)
         {
            list[data[index].rowid]= data[index];
         }


        return(list);
    },

    displayGameList : function(){
         $('#games tbody').empty();

         for(index in gameList)
         {
            var game = gameList[index];
            var activeClass = "red glyphicon-remove-sign";
            if(game.active == 1) activeClass = "green glyphicon-ok-sign";
            var teamDisplay = "";
            var JSONTeam = JSON.parse(game.teams);
            for(i in JSONTeam){

                teamDisplay += " " + JSONTeam[i].name + " " + JSONTeam[i].score + "<br/>";
            }
            var JSONmissions = {};
            var missionLength = 0

            if(game.missions){

                if(JSON.parse(game.missions).missions)
                    missionLength = parseInt($.map(JSON.parse(game.missions).missions, function(n, i) { return i; }).length);
            }

            var gameid = (parseInt(index)+1);
            $('#games').append('<tr>'
                + '<td>' + game.rowid + '</td>'
                + '<td> <a href="#" class="gameDetails" gameid="'+ game.rowid +'" >' + game.name + '</a></td>'
                + '<td>' + game.map + '</td>'

                + '<td>' + missionLength + '</td>'
                + '<td>' + teamDisplay + '</td>'
                + '<td>'
                +'<button type="button" gameid="'+game.rowid+'" active="' + game.active + '" class="toggleBtn btn btn-default" aria-label="Left Align"><span class="glyphicon '+ activeClass +'" aria-hidden="true"></span></button>'
                + '</td>'
                + '<td class="tools" >'
                +'<button type="button" gameid="'+game.rowid+'" class="supprBtn btn btn-default" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>'
                +'<button type="button" gameid="'+game.rowid+'" class="editBtn btn btn-default" aria-label="Left Align"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button>'
                + '</td>'
                + '</tr>');
         }

         module.gamesPage.setEvent();
     },

     editGame : function(gameid){
             window.location.href = '/admin/details?gameid='+gameid.rowid;
     },

    };


    module.detailsPage = {


        init : function(){

                  module.detailsPage.fillDetails(gameid);
                    module.detailsPage.setEvent();


        },

         setEvent: function(){
           // $('*').off( "click");

            $('#btn-save').button().on( "click", function() {

                    console.log('saving');
                   module.detailsPage.saveGame();
                   return false;

            });


             //$('#add-missionObjectives').off( "click");
             $('#add-missionObjectives').off('click');
             $('body').on('click', '#add-missionObjectives', function() {


                                module.detailsPage.addObj();
                                return false;

                          });
             $('#saveMission').button().on( "click", function() {


                  module.detailsPage.addMission(module.detailsPage.makeMissionJSON());

                  $('#missionModal').modal('hide');
             });

             $('#missionModal').on('show.bs.modal', function (event) {
               var button = $(event.relatedTarget) // Button that triggered the modal
               var missionid = button.data('missionid') // Extract info from data-* attributes
               // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
               // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.

               module.detailsPage.fillMissionDetails(missionid,$(this));

             })

             $('body').on('click', '.deleteObj', function() {
                 $(this).parents("div:first").parents("div:first").remove();
                 module.detailsPage.updateObjIds();
             });

             $('body').on('click', '.delete-mission', function() {

                         console.log("delete this : " + $(this).data("missionid"));
                   module.detailsPage.removeMission($(this).data("missionid"));
             });





        },

        fillDetails : function(gameid){

            if(gameid){

              var query = '/admin/getGames?gameid='+gameid;

                 $.getJSON( query, function( data ) {


                 $('#id').val(data[0].rowid);
                 $('#name').val(data[0].name);
                 $('#map').val(data[0].map);
                 $('#duration').val(data[0].duration);
                 $('#missions').val(data[0].missions);


                 var teamsJSON = JSON.parse(data[0].teams);
                 for(index in teamsJSON)
                 {
                      $('#team'+ (parseInt(index)+1) +'Id').val((parseInt(index)+1));
                      $('#team'+ (parseInt(index)+1) +'Name').val(teamsJSON[index].name);
                      $('#team'+ (parseInt(index)+1) +'Logo').val(teamsJSON[index].logo);
                      $('#team'+ (parseInt(index)+1) +'Score').val(teamsJSON[index].score);
                 }

                 module.detailsPage.displayMissions();
                 //module.detailsPage.setEvent();

                });
            }
        },

        fillMissionDetails: function(missionid,modal){

            if(missionid){
               modal.find('#missionId').val(missionid);

               var allMissions = JSON.parse($("#missions").val());
               var currentMission = allMissions.missions[missionid];
               console.log(JSON.stringify(currentMission));


               $('#missionObjectives').html("");


               modal.find('#missionName').val(currentMission.name);

               modal.find('#missionStart').val(currentMission.start);
               modal.find('#missionEnd').val(currentMission.end);
               modal.find('#missionTeam').val(currentMission.team);
               modal.find('#missionDesc').val(currentMission.desc);
               modal.find('#missionOrga').val(currentMission.orga);


               for(objIndex in currentMission.objectives){
                 module.detailsPage.addObj(currentMission.objectives[objIndex]);

               }
            }else{

            modal.find('form')[0].reset();
                //modal.find('input, select, textarea').val('');

            }




        },


        saveGame: function() {
                  var valid = true;
                  //allFields.removeClass( "ui-state-error" );
                  var gameid = $( "#id" ).val();

                  teamList = [];

                  valid = valid && common.form.checkLength( $( "#name" ), "name", 1, 80 );
                  valid = valid && common.form.checkLength( $( "#teamList input[type=text]" ), "Teams", 1, 80 );

                  if ( valid ) {

                    $.each($('#teamList fieldset'),function(i, currentFS){

                        var currentTeam = $('#'+currentFS.id).attr('teamnumber');


                        teamList.push({
                            'id' : $('#'+currentFS.id +' input[type=hidden]').val(),
                            'name' : $('#'+currentFS.id +' input[type=text]').val(),
                            'logo' : $('#'+currentFS.id +' input[type=file]').val(),
                            'score' : $('#team'+currentTeam +'Score').val(),
                         });

                    });
                    var newGame = {};

                    var missions = {};
                    if($('#missions').val())missions = JSON.parse($('#missions').val());


                    if(gameid)
                    newGame["game"] = {'rowid': $( "#id" ).val(),'name' : $( "#name" ).val(), 'map' : $( "#map" ).val(), 'duration' : $('#duration').val(), 'teams' : teamList, 'missions' : missions};
                    else
                    newGame["game"] = {'name' : $( "#name" ).val(), 'map' : $( "#map" ).val(), 'duration' : $('#duration').val(), 'teams' : teamList, 'missions' : missions};


                    socket.emit('adminAddGame', newGame);

                    location.href=('/admin/games');


                  }
                  return valid;
                },


        addObj: function(objective){
            $('#tempDiv').load('/templates.ejs .objectiveRow', function(){

                        var $clone = $('#tempDiv .objectiveRow').clone(true,true);
                         // get actual mission number
                        var objectiveNumber =  $('.objectiveRow').length


                        $clone.find('.objectiveid').attr('value',objectiveNumber);

                         $clone.find('input').attr('objectiveId',parseInt(objectiveNumber));
                         $clone.find('select').attr('objectiveId',parseInt(objectiveNumber));
                         $clone.find('textarea').attr('objectiveId',parseInt(objectiveNumber));

                         if(objective){
                                $clone.find("input, select").each(function(index, element){

                                $(this).attr('objectiveId',objective.id);
                                $(this).val(objective[$(this).attr('name')]);
                                });

                         }

                        $('#missionObjectives').append($clone);

                         module.detailsPage.updateObjIds();

                         $('#tempDiv').empty();

                 });

        },

        updateObjIds: function(){
            $('.objectiveRow .objectiveid').each(function(index){
                $(this).attr('value',index+1);
            });

        },



        makeMissionJSON : function(){
           missionJSON = {};

          // if($('#missionJSON').val()=="")missionJSON = {'timeline' : [], 'missions': []};

            var missionid = $('#missionId').val();

            var allObjectives = {};



           $(".objectiveRow input,.objectiveRow select").each(function(index, element){

                var currentObjective = {};
                var objectiveId = $(this).attr('objectiveId');

                if(allObjectives[objectiveId])currentObjective = allObjectives[objectiveId];


                currentObjective[$(this).attr('name')]=$(this).val();

                console.log($(this).attr('name')+ " = " +$(this).val());

                console.log(JSON.stringify(currentObjective));

                allObjectives[parseInt(objectiveId)] = currentObjective;

           });

            console.log(JSON.stringify(allObjectives));

            missionJSON.id = missionid;
            missionJSON.name = $('#missionName').val();
            missionJSON.start = $('#missionStart').val();
            missionJSON.end = $('#missionEnd').val();
            missionJSON.team = $('#missionTeam').val();
            missionJSON.desc = $('#missionDesc').val();
            missionJSON.orga = $('#missionOrga').val();


            missionJSON.objectives = allObjectives;

            return missionJSON;

        },

        buildTimeLine(missionsList){

            var timeline = {};

            if(missionsList){

                for(currentMission in missionsList){

                    if(currentMission=="size") continue;

                    if(!timeline[missionsList[currentMission].start])timeline[missionsList[currentMission].start]=[];
                    timeline[missionsList[currentMission].start].push(missionsList[currentMission].id);
                }
            }

            return timeline;



        },

        addMission : function(missionJSON){

            // retrieve current missions :

            var allMissions = {};

            if($("#missions").val()) allMissions = JSON.parse($("#missions").val());

            if(!allMissions.missions)
                allMissions = {'timeline':{}, 'missions' : {'size':0}};

           // add to all mission objects
           if(missionJSON.id==0){
                       // new
                    allMissions.missions.size = parseInt( allMissions.missions.size)+1;
                   // missionJSON.id = ""+(parseInt(Object.keys(allMissions.missions).length) + 1);
                     missionJSON.id =  allMissions.missions.size;

            }

            allMissions.missions[missionJSON.id]=missionJSON;
            allMissions.timeline = module.detailsPage.buildTimeLine(allMissions.missions);

            $("#missions").val(JSON.stringify(allMissions));


            module.detailsPage.displayMissions();

        },

        removeMission: function(missionId){

            var allMissions = JSON.parse($("#missions").val());



            delete allMissions.missions[missionId];
            allMissions.timeline = module.detailsPage.buildTimeLine(allMissions.missions);
            $("#missions").val(JSON.stringify(allMissions));
            module.detailsPage.displayMissions();


        },

        displayMissions : function(){


            $('#missionList, #missionListRed, #missionListBoth, #missionListBlue').empty();

            var allMissions = {'timeline':{}, 'missions' : {}};

            if($("#missions").val())allMissions = JSON.parse($("#missions").val());

            var gameDuration = parseInt($('#duration').val());
            var timeStep = 0;

            while(timeStep < gameDuration){
                var style = "height:10px;overflow: visible;";


                if(timeStep%5 == 0) style+= "border-top:1px solid #000;"
            $('#missionList').append('<div class="row" id="time'+timeStep+'" style="'+ style +'"></div>');
                timeStep += 1;


            }


             $('#tempDiv').load('/templates.ejs .missionPanel', function(){

                for(time in allMissions.timeline){
                    for(missionIndex in allMissions.timeline[time]){

                        var targetDiv ="";
                        var classDiv = "";


                        var $clone = $('#tempDiv .missionPanel').clone(true,true);

                        var mission = allMissions.missions[allMissions.timeline[time][missionIndex]];

                        switch(mission.team){
                            case "team1":
                                targetDiv = '#missionListRed';
                                classDiv = 'panel-red';
                                break;
                            case "team2":
                                targetDiv = '#missionListBlue';
                                classDiv = 'panel-blue';
                                break;
                            case "both":
                                 targetDiv = '#missionListBoth';
                                 classDiv = 'panel-both';
                                break;

                        }


                        //$('#tempDiv .missionPanel').children('.test').append("lol")
                        $clone.find('.panel').addClass(classDiv).attr('style','height:'+10* ( parseInt(mission.end) - parseInt(mission.start))+'px').attr('clear','none');
                        //$clone.find('.panel-heading').empty();
                        //$clone.find('.panel-heading').html(mission.name);

                        $clone.find('.title').append(mission.name);
                        $clone.find('.badge').append(mission.start + '-' + mission.end);
                        $clone.find('button').attr('data-missionid',mission.id);


                            var missionTotalScore = 0;

                        for(objIndex in mission.objectives){
                            if(mission.objectives[objIndex].missionObjectivesScore)
                             missionTotalScore+= parseInt(mission.objectives[objIndex].missionObjectivesScore);
                            //$clone.find('.list-group').append('<li class="list-group-item"><span class="badge">'+ mission.objectives[objIndex].missionObjectivesScore +'</span>'+mission.objectives[objIndex].missionObjectivesType+'</li>');

                        }

                        $clone.find('.title').append('<span class="badge">'+missionTotalScore+'pts</span>');

                        $clone.addClass(classDiv);


                        $('#time'+mission.start).append($clone);

                    }

                }
            });




        },




    };
