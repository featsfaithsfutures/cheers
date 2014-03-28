var _ = require('underscore');
fileSystem = require('fs');
path = require('path');
app = require('express.io')()
nconf   = require('nconf')
app.http().io()
port = process.env.PORT || 2014
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

app.io.route('joinSubscribeOnly', function(req) {
  schoolid = req.data.id;
  if(schoolid < 0) return;
  console.log("joining subscriber-only room for school <"+schoolid+">")
  req.io.join(getSubscriberOnlyRoom(schoolid))
  req.io.emit('cheerCount', buildCheerData(schoolid))
})

app.io.route('leaveSubscribeOnly', function(req) {
  schoolid = req.data.id;
  if(schoolid < 0) return;
  console.log("leaving subscriber-only room for school <"+schoolid+">")
  req.io.leave(getSubscriberOnlyRoom(schoolid))
})


app.io.route('noMoreCheers', function(req) {
    schoolid = req.data.id;
    if(schoolid < 0) return;
    console.log("de-registering to cheer for school <" +schoolid+ ">");
    req.io.leave(schoolid)
    console.log("departed room <" +schoolid+ ">")
    updateRoom(schoolid);
    cheer_data = buildCheerData(schoolid)
    console.log("sending final count of <" + cheer_data.cheers +"> for  <" +schoolid+ ">")
    req.io.emit('cheerCount', cheer_data)
})

// websocket route/event for getting current cheer count for any school
app.io.route('cheerCount', function(req){
  schoolid = req.data.id;
  if(schoolid < 0) return;
  cheerers = getCurrentCheerersForSchool(schoolid)
  console.log("sending count of <" + cheerers +"> for  <" +schoolid+ ">")
  req.io.emit('cheerCount', buildCheerData(schoolid))
})

// websocket route/event for getting leaderboard
app.io.route('fetchLeaderBoard', function(req){
  boardSize = req.data.top
  console.log("sending leaderboard")
  //req.io.emit('leaderBoard', _.first(getLeaderBoard(), 10)) // replace after testing
  req.io.emit('leaderBoard', generateFakeLeaderBoard().slice(0,boardSize)) // TODO: switch out fake data 
})


app.get('/leaderboard', function(req, res){
  res.json(_.first(getLeaderBoard(), 10))
})

app.get('/total', function(req, res){
  res.json(getTotalCheerers())
})

// plain http for getting current cheer count for any school
app.get('/cheer_count/:id', function(req, res){
  schoolid = req.params.id;
  if(schoolid < 0) return {};
  res.json({cheers: getCurrentCheerersForSchool(schoolid)})
})


app.get('/cheer/:id?', function(req, res) {
    res.sendfile(__dirname + '/client.html')
})

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/leaderboard.html')
})


// Send the client html.
app.get('/schools', function(req, res) {
    res.sendfile(__dirname + '/schools.json')
})

app.get('/listcheers', function(req, res){
  res.json(getAllCurrentCheerers())
})

app.get('/public/js/core.js', function(req, res){
    res.sendfile(__dirname + '/public/js/core.js');
})
app.get('/public/js/bufferLoader.js', function(req, res){
    res.sendfile(__dirname + '/public/js/bufferLoader.js');
})
app.get('/public/sounds/Sports_Crowd.mp3', function(req, res){
    var filePath = path.join(__dirname, '/public/sounds/Sports_Crowd.mp3');
    var stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': 'audio/mp3',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(res);
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

function getSubscriberOnlyRoom(id){
  return "_subscribers-only-" + id
}


function buildCheerData(_id){
  return {cheers: getCurrentCheerersForSchool(_id), totalCheers: getTotalCheerers(), schoolId: _id}
}

function updateRoom(schoolid){
  console.log("broadcasting cheer count = <" +   getCurrentCheerersForSchool(schoolid) + "> for school <" + schoolid + ">")
  cheer_data = buildCheerData(schoolid)
  app.io.room(schoolid).broadcast("cheerCount",cheer_data) 
  app.io.room(getSubscriberOnlyRoom(schoolid)).broadcast("cheerCount",cheer_data)
  app.io.broadcast("globalCheerCount", cheer_data)
}

function getLeaderBoard(){
  return _.sortBy(getAllCurrentCheerers(), function(item){return item.cheers}).reverse()
}

// hide the implentation incase we go back to a sep. external array
function getCurrentCheerersForSchool(schoolid){
  return app.io.sockets.clients(schoolid).length
}

function isRoomCountable(room){
 return ( (room != "") && (room.slice(0,3) != "/_s") ) 
}

function getTotalCheerers(){
  result = _.inject(app.io.sockets.manager.rooms, function(all, socketids, room){
    if (isRoomCountable(room)) {
      return all + socketids.length
    } else {
      return all
    }
  },0)
  return result
}
// return a mapping of room/school ids to number of participants (cheerers)
function getAllCurrentCheerers(){
  result = _.inject(app.io.sockets.manager.rooms, function(all, socketids, room){
    if (isRoomCountable(room)) {
      return all.concat([{id: room.slice(-1), cheers: socketids.length}])
    } else {
      return all
    }
  },[])
  return result
}

function getTotalCheerers(){
    result = _.inject(app.io.sockets.manager.rooms, function(all, socketids, room){
        if (room != "") {
            return all + socketids.length
        } else {
            return all
        }
    },0)
    return result
}

function generateFakeLeaderBoard(){
  lb = []
  for(var i = 0; i<=10; i++){ 
    lb = lb.concat({
        id: Math.floor(Math.random() * 100).toString(), 
        cheers: Math.floor(Math.random() * 20) + 1
    })
  } 
  return _.sortBy(lb, function(item){return item.cheers}).reverse()
}