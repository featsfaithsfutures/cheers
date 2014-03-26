app = require('express.io')()
app.http().io()
var port = 2014
// hacky "global" to keep track of cheers. Drops back to zero on process exit
var cheers = []

app.io.route('cheer!', function(req) {
  schoolid = req.data.id
  console.log("joining room <" +schoolid+ ">")
  req.io.join(schoolid)
  console.log("registering a cheer for school <" +schoolid+ ">")
  cheers[schoolid] = (++cheers[schoolid] || 0)
  console.log("broadcasting cheer count [" + cheers[schoolid] + " for school <" +schoolid+ ">")
  
  // broadcast this to _all_ clients connected to this school room
  app.io.room(schoolid).broadcast("cheerCount", {cheers: cheers[schoolid]})
})


// Send the client html.
app.get('/cheer', function(req, res) {
    res.sendfile(__dirname + '/client.html')
})

app.listen(port)
