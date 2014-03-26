/**
 * Created by smclean on 3/25/14.
 */

exports.initialize = (function(io){
    io.sockets.on('connection', function (socket) {

        socket.on('joinSchool', function(data){

        });

        socket.on('cheerStart', function (data) {
            count++;
            handleCounter();
        });

        socket.on('cheerEnd', function (data){
             count--;
            handleCounter();
        });
    });

    var count = 0;

    function handleCounter()
    {
        io.sockets.emit('cheerCount', {
            count: count
        });
    }
});