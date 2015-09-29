$( document ).ready(function() {

     var socket = io();
     socket.on("activation", function(data){
     console.log("activation !");
         location.reload();
    });
});
