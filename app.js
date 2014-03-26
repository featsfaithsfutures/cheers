app = require('express.io')()
app.http().io()
var port = 2014
// hacky "global" to keep track of cheers. Drops back to zero on process exit
var cheers = []
app.io.route('cheer!', function(req) {
  schoolid = req.data.id
  cheers[schoolid] = (++cheers[schoolid] || 0)
  req.io.broadcast("cheerCount", {cheers: cheers[schoolid]})
})

app.io.route('roomCheer!', function(req) {
  schoolid = req.data.id
  req.io.join(schoolid)
  cheers[schoolid] = (++cheers[schoolid] || 0)
  req.io.room(schoolid).broadcast("roomCheerCount", {cheers: cheers[schoolid]})
})


// Send the client html.
app.get('/cheer', function(req, res) {
    res.sendfile(__dirname + '/client.html')
})

app.listen(port)
