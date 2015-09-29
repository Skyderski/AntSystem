$(function() {

    var module.gamesPage = {

    init: function(){


    },



    };


    var module.detailsPage = {



    };

}); // end of $(function()









$(function() {


   // var gameList = [];
var socket = io();
// modal functions

var dialog, form,
      id = $( "#id" ),
      newGame ={"game" : []},
      name = $( "#name" ),
      map = $( "#map" ),
      teamList =  [],
      teams = $( "#teamList input[type=text]" ),
      allFields = $( [] ).add( name ).add( map ).add(teams);




    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        return false;
      } else {
        return true;
      }
    }

    function addGame() {
      var valid = true;
      allFields.removeClass( "ui-state-error" );
      var gameid = $( "#id" ).val();

      teamList = [];



      valid = valid && checkLength( $( "#name" ), "name", 1, 80 );
      valid = valid && checkLength( $( "#teamList input[type=text]" ), "Teams", 1, 80 );

      if ( valid ) {

        $.each($('#teamList fieldset'),function(i, currentFS){

            var currentTeam = $('#'+currentFS.id).attr('teamnumber');
            console.log(currentTeam);

            teamList.push({

                'name' : $('#'+currentFS.id +' input[type=text]').val(),
                'logo' : $('#'+currentFS.id +' input[type=file]').val(),
                'score' : $('#team'+currentTeam +'Score').val(),
             });

        });

        newGame["game"]= {'rowid': $( "#id" ).val(),'name' : $( "#name" ).val(), 'map' : $( "#map" ).val(), 'duration' : $('#duration').val(), 'teams' : teamList, 'missions' : $('missionJSON').val()};

        socket.emit('adminAddGame', newGame);


        dialog.dialog( "close" );
      }
      return valid;
    }

    dialog = $( "#dialog-form" ).dialog({
      autoOpen: false,
      height: 800,
      width: 1600,
      modal: true,
      buttons: {
        "Enregistrer": addGame,
        Cancel: function() {
          dialog.dialog( "close" );
        }
      },
      open : function(){
       setEvent();
      },

      close: function() {
        //$('#gameEditor').reset();
        id.val('');
        allFields.removeClass( "ui-state-error" );
      }
    });

    form = dialog.find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
      addGame();
    });




// display functions


    var updateList = function(data,list){
        // reset list
    list = [];
    for(index in data)
     {
        list[data[index].rowid]= data[index];
     }


    return(list);
    };


     var displayGameList = function(){
         $('#games tbody').empty();

         for(index in gameList)
         {
            var game = gameList[index];
            var statusClass = "green glyphicon-play";
            if(game.status == "started") statusClass = "red glyphicon-stop";
            var teamDisplay = "";
            var JSONTeam = JSON.parse(game.teams);
            for(i in JSONTeam){

                teamDisplay += " " + JSONTeam[i].name + " " + JSONTeam[i].score + "<br/>";
            }

            var gameid = (parseInt(index)+1);
            $('#games').append('<tr>'
                + '<td>' + game.rowid + '</td>'
                + '<td> <a href="#" class="gameDetails" gameid="'+ game.rowid +'" >' + game.name + '</a></td>'
                + '<td>' + game.map + '</td>'

                + '<td>' + game.missions + '</td>'
                + '<td>' + teamDisplay + '</td>'
                + '<td>'
                +'<button type="button" gameid="'+game.rowid+'" status="' + game.status + '" class="toggleBtn btn btn-default btn-xs" aria-label="Left Align"><span class="glyphicon '+ statusClass +'" aria-hidden="true"></span></button>'
                + '</td>'
                + '<td class="tools" >'
                +'<button type="button" gameid="'+game.rowid+'" class="supprBtn btn btn-default btn-xs" aria-label="Left Align"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>'
                +'<button type="button" gameid="'+game.rowid+'" class="editBtn btn btn-default btn-xs" aria-label="Left Align"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button>'
                + '</td>'
                + '</tr>');
         }

         setEvent();
     };

     var initDetails = function(){

      var query = '/admin/getGames?gameid='+gameid;

         $.getJSON( query, function( data ) {

         console.log(JSON.stringify(data[0]));
         $('#id').val(data[0].rowid);
         $('#name').val(data[0].name);
         $('#map').val(data[0].map);
         $('#duration').val(data[0].duration);

         var teamsJSON = JSON.parse(data[0].teams);
         for(index in teamsJSON)
         {
              $('#team'+ (parseInt(index)+1) +'Name').val(teamsJSON[index].name);
              $('#team'+ (parseInt(index)+1) +'Logo').val(teamsJSON[index].logo);
              $('#team'+ (parseInt(index)+1) +'Score').val(teamsJSON[index].score);
         }

         setEvent();

        }
       };

     var editGame = function(gameid){
        window.location.href = '/admin/details?gameid='+gameid.rowid;
        $('#dialog-form').load('/admin/games?gameid='+gameid.rowid, function(){

            var query = '/admin/getGames?gameid='+gameid.rowid;


            $.getJSON( query, function( data ) {

                console.log(JSON.stringify(data[0]));
                $('#id').val(data[0].rowid);
                $('#name').val(data[0].name);
                $('#map').val(data[0].map);
                $('#duration').val(data[0].duration);

                var teamsJSON = JSON.parse(data[0].teams);
                for(index in teamsJSON)
                {
                 $('#team'+ (parseInt(index)+1) +'Name').val(teamsJSON[index].name);
                 $('#team'+ (parseInt(index)+1) +'Logo').val(teamsJSON[index].logo);
                 $('#team'+ (parseInt(index)+1) +'Score').val(teamsJSON[index].score);
                }





                setEvent();
                dialog.dialog( "open" );

            });

        });



     };

     var addObj = function(){
console.log('ici');
        $('#tempDiv').load('/templates.ejs .MissionsRow', function(data){
                $('#missionObjectives').append($('#tempDiv').html());

        });
     };


     var updateMissions= function(){
        console.log( + $('#missionJSON').val());
        var missionJSON = {'timeline' : [], 'missions': []};
        var currentMission = {
            'id' : $('#missionJSON').val(),
            missionName: "",
            missionStart: "",
            missionEnd: "",
            missionTeam: "",

        };

        if($('#missionJSON').val())missionJSON = JSON.parse($('#missionJSON').val());


        // add to all mission objects

        if($('#missionId'.val())){
        // edit


        }else{
        // new


        }


        console.log(JSON.stringify(missionJSON));



     };

     // events
    var setEvent = function(){


        $('*').off( "click");

        $( "#create-game" ).off("click");

        $( "#create-game" ).button().on( "click", function() {
           form[ 0 ].reset();

           dialog.dialog( "open" );
         });

         $( ".toggleBtn" ).button().on( "click", function() {

             var status = "stopped";
             if($(this).attr('status') == "stopped") status = "started";

             var data = { 'rowid' : $(this).attr('gameid'), 'status' : status};
             socket.emit('toggleStatus',data);
         });

         $( ".supprBtn" ).button().on( "click", function() {
             socket.emit('removeGame',$(this).attr('gameid'));
         });


         $('.editBtn').button().on( "click", function() {
             editGame(gameList[$(this).attr('gameid')]);
         });

         $('.gameDetails').button().on( "click", function() {
                editGame(gameList[$(this).attr('gameid')]);


         });

         $('#missionform input').each(function(){

             $(this).on( "change", function() {
                updateMissions();

              });

         });
          $('#missionform textarea').each(function(){

              $(this).on( "change", function() {
                 updateMissions();

               });

           });


         //$('#add-missionObjectives').off( "click");
         $('#add-missionObjectives').button().on( "click", function() {

                addObj();
                return false;
         });




};



         // socket functions

         socket.on('gameList', function(data){
               gameList = updateList(data,gameList);
                displayGameList(gameList);
         });

        socket.on('gamedetails', function(data){
               gameList = updateList(data,gameList);
                displayGameList(gameList);
         });




// update nav bar
$('#main-nav-bar li a').each(function(){
    if($(this).attr('href') == window.location.pathname )$(this).parent().addClass('active');

});
setEvent();

$.getJSON( "/admin/getGames", function( data ) {

 gameList = updateList(data,gameList);
 displayGameList();

})



displayGameList();



});





