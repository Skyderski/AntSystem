var common = {};
var socket = io();



    common.form = {

        checkLength: function( o, n, min, max ) {
          if ( o.val().length > max || o.val().length < min ) {
            o.addClass( "ui-state-error" );
            return false;
          } else {
            return true;
          }
        },



    }