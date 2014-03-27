var _ = require('underscore');
app = require('express.io')()
app.http().io()
var port = process.env.PORT || 2014

// array of array: this is a list of schools who also has a list of session ids of the people cheering.
var schoolCheers = [];

app.io.route('cheer!', function(req) {
    // need to make sure clients are unique in max counts & room joining
    schoolid = req.data.id;

    // create array object for new school
    if(schoolCheers[schoolid] == null){
        schoolCheers[schoolid] = new Array();
    }
    // check if the current socket is cheering, if cheering, add to the schoolCheer array
    if(!_.contains(schoolCheers[schoolid], req.socket.id))
    {
        console.log("registering a cheer for school <" +schoolid+ ">");
        schoolCheers[schoolid].push(req.socket.id);
        // broadcast this to _all_ clients connected to this school room
        app.io.room(schoolid).broadcast("cheerCount",
            {cheers: schoolCheers[schoolid].length}
        )
        console.log("broadcasting cheer count = " +  schoolCheers[schoolid].length);
    }

})

app.io.route('noMoreCheers', function(req) {
    schoolid = req.data.id;

    // check if the current socket is cheering, if cheering, remove from the schoolCheer array
    if(_.contains(schoolCheers[schoolid], req.socket.id))
    {
        console.log("de-registering a cheer for school <" +schoolid+ ">");
        // remove from array.
        schoolCheers[schoolid] = _.without(schoolCheers[schoolid], _.findWhere(schoolCheers[schoolid], req.socket.id));

        // broadcast this to _all_ clients connected to this school room
        app.io.room(schoolid).broadcast("cheerCount",
            {cheers: schoolCheers[schoolid].length}
        )
        console.log("broadcasting cheer count = " +  schoolCheers[schoolid].length);
    }
})

// Route for joining a school room by Id
app.io.route('joinSchool', function(req) {
    schoolid = req.data.id
    console.log("joining room <" +schoolid+ ">")
    req.io.join(schoolid)
})
// Route for leaving a school room by Id
app.io.route('leaveSchool', function(req){
    schoolid = req.data.id
    console.log("departing room <" +schoolid+ ">")
    req.io.leave(schoolid)
})


// Send the client html.
app.get('/cheer', function(req, res) {
    res.sendfile(__dirname + '/client.html')
})

// Send the client html.
app.get('/schools', function(req, res) {
    res.sendfile(__dirname + '/schools.json')
})
app.listen(port)
