var module = {};
var socket = io();



    module.form = {

        checkLength: function( o, n, min, max ) {
          if ( o.val().length > max || o.val().length < min ) {
            o.addClass( "ui-state-error" );
            return false;
          } else {
            return true;
          }
        },



    }