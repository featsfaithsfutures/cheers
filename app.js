var _ = require('underscore');
app = require('express.io')()
var nconf   = require('nconf')
var SbStore = require('socket.io-servicebus');
app.http().io()
var port = process.env.PORT || 2014
nconf.file('config.json').env();

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

/*

// stubbed out for later use when/if converting console logging to in browser
app.io.route('admin-listen', function(req) {
  req.io.join("admin")
}

app.io.route('admin-depart', function(req) {
  req.io.leave("admin")
}

// Send the admin html.
app.get('/admin', function(req, res) {
    res.sendfile(__dirname + '/admin.html')
})
*/

/*
 look at setInterval(callback, delay, [arg], [...]) for running archival queue push
*/


app.io.configure(function(){
  app.io.set('store', new SbStore({
    topic: nconf.get("SERVICE_BUS_TOPIC"),
    connectionString: nconf.get("SERVICE_BUS_ENDPOINT"),
    logger: app.io.get('logger')
  }));
});

app.listen(port)
