var _ = require('underscore');
app = require('express.io')()
var nconf   = require('nconf')
app.http().io()
var port = process.env.PORT || 2014
nconf.file('config.json').env();

if ('servicebus' == nconf.get('SOCKET_STORAGE')) {
  console.log("Using servicebus as store in production")
  var SbStore = require('socket.io-servicebus');
  app.io.configure(function(){
    app.io.set('store', new SbStore({
      topic: nconf.get("SERVICE_BUS_TOPIC"),
      connectionString: nconf.get("SERVICE_BUS_ENDPOINT"),
      logger: app.io.get('logger')
    }));
  });  
} else {
  console.log("using default socket.io memory store")
}

app.io.route('cheer!', function(req) {
    schoolid = req.data.id;
    if(schoolid < 0) return;
    console.log("registering a cheer for school <" +schoolid+ ">");
    req.io.join(schoolid)
    console.log("joined room <" +schoolid+ ">")    
    updateRoom(schoolid);
})

app.io.route('noMoreCheers', function(req) {
    schoolid = req.data.id;
    if(schoolid < 0) return;
    console.log("de-registering to cheer for school <" +schoolid+ ">");
    req.io.leave(schoolid)
    console.log("departed room <" +schoolid+ ">")
    updateRoom(schoolid);
    remainingCheerers = getCurrentCheerersForSchool(schoolid)
    console.log("sending final count of <" + remainingCheerers +"> for  <" +schoolid+ ">")
    req.io.emit('cheerCount', {cheers: remainingCheerers})
})

// Route for joining a school room by Id
app.io.route('joinSchool', function(req) {
    schoolid = req.data.id
    console.log("got join school event for <" +schoolid+ ">")
    //req.io.join(schoolid)
    //updateRoom(schoolid);
})

// Route for leaving a school room by Id
app.io.route('leaveSchool', function(req){
    schoolid = req.data.id
    console.log("got leave school event for<" +schoolid+ ">")
    //req.io.leave(schoolid)
    //updateRoom(schoolid);    
})


// Send the client html.
app.get('/cheer', function(req, res) {
    res.sendfile(__dirname + '/client.html')
})

// Send the client html.
app.get('/schools', function(req, res) {
    res.sendfile(__dirname + '/schools.json')
})

app.get('/listcheers', function(req, res){
  res.json(getAllCurrentCheerers())
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

app.listen(port)

function updateRoom(id){
    console.log("broadcasting cheer count = <" +   getCurrentCheerersForSchool(schoolid) + "> for school <" + id + ">");
    app.io.room(id).broadcast("cheerCount",
        {cheers: getCurrentCheerersForSchool(schoolid), schoolId: id}
    )
}

// hide the implentation incase we go back to a sep. external array
function getCurrentCheerersForSchool(schoolid){
  return app.io.sockets.clients(schoolid).length
}

// return a mapping of room/school ids to number of participants (cheerers)
function getAllCurrentCheerers(){
  result = _.inject(app.io.sockets.manager.rooms, function(all, socketids, room){
    if( room != "" ) { all[room.slice(-1)] = socketids.length }
    return all
  },{})
  return result
}
  

