const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const session = require("express-session")({ secret: "laalsa", resave: true, saveUninitialized: true });
const cookieparser = require('cookie-parser');
const debug = require('debug');

var events = require('events');
var event = new events.EventEmitter();
module.exports.eventEmitter = event;

event.on('uploadCreation', (useSession) => {
  // console.log('user data with session coming to uploadcreation ::: ', useSession.numPartsLeft+'  '+ useSession.userdata);
  let customSessionObj = customSession.get(useSession.userdata);
  if (customSessionObj["totalChunks"] == null && customSessionObj["remainingChunks"] == null) {
    customSessionObj["totalChunks"] = useSession.numPartsLeft;
    customSessionObj["remainingChunks"] = useSession.numPartsLeft;

    customSession.set(useSession.userdata, customSessionObj);
    console.log("for the first time setting value *********", customSession.get(useSession.userdata))
  }

})

event.on("reduceChunk", data => {

  console.log('mltipartparams value ::: ', data['multipartparams']);
  if (customSession.has(data.userid)) {
    let customSessionObj = customSession.get(data.userid);
    customSessionObj["remainingChunks"] = data["numPartsLeft"]-1;
    customSessionObj["nextStartChunk"] = data['multipartparams'];
    customSession.set(data.userid, customSessionObj);
    console.log("after chunk reduction in the map *******************:: ", customSession.get(data.userid))
  }
})


let customSession = new Map();
module.exports.customGlobalSession = customSession;

const sharedsession = require("express-socket.io-session");


const multiPartUploader = require('./test');

// cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-access-token',
  );
  res.header(
    'Access-Control-Expose-Headers',
    'Content-Disposition, x-access-token',
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'views')));

app.use(session);

//let customSession = new Map();
//module.exports.customSession;

io.use(sharedsession(session, { autoSave: true }));

//app.use(session({ secret: 'laalsa', resave: true, saveUninitialized: true, }));
io.on('connect', function (socket) {
  console.log('socket id ::: ', socket.id);
  console.log("client connected .... ");

  socket.on('start', async function (file) {

    // console.log('dtat file :: ', file);
    //console.log('sessionID in start on method ::: ' + socket.handshake.sessionID);

    socket.handshake.session.userdata = file.userid;
    socket.handshake.session.save();
    //global.customSession = socket.handshake.session.userdata;

    //console.log('session data need cookie ::::: ', socket.handshake.session);
    if (customSession.has(file.userid)) {
      let customSessionObj = customSession.get(file.userid);
      
      if (customSessionObj["totalChunks"] != null && customSessionObj["totalChunks"] != null) {
        customSessionObj["socketSessionId"] = socket.handshake.sessionID;
        // let mutiPartId = await multiPartUploader.createMultipartUpload(file.fileName, file.fileSize, socket.handshake.session.userdata);
        // customSessionObj["uploadID"] = mutiPartId;
        customSessionObj["nextStartChunk"] = customSessionObj["nextStartChunk"].Parts.length;
        
        //customSessionObj["nextStartChunk"] = data['multipartparams'];
        console.log("*************user was alredy present", customSession.get(file.userid));
        socket.emit("nextChunkResume", customSessionObj);
      }
    } else {
      let customSessionObj = {
        "socketSessionId": socket.handshake.sessionID,
        "totalChunks": null,
        "remainingChunks": null,
        "nextStartChunk":null,
        "uploadID": null
      }

      customSession.set(file.userid, customSessionObj);
      let mutiPartId = await multiPartUploader.createMultipartUpload(file.fileName, file.fileSize, socket.handshake.session.userdata);
      customSessionObj["uploadID"] = mutiPartId;
      customSession.set(file.userid, customSessionObj);
      socket.emit("uploadToken1", mutiPartId)
      console.log('multi part id :: ', mutiPartId);
    }

  });

  socket.on('data', async function (data) {
    console.log("this is what the multipartContains  ===========  >>>> ", data);
    if (data.userid) {
      await multiPartUploader.initUpload(data.multipart, data.partNum, data.buffer, data.fileSize, data.fileKey, { "userid": data.userid });
      // let custSessObj = customSession.get(data.userid);
      // console.log('dat read for next chunk ::: ', custSessObj.nextStartChunk.Parts.length);
      //let startPos = custSessObj.nextStartChunk.Parts.length;
      // let startPos = Number(custSessObj["totalChunks"]) - Number(custSessObj["remainingChunks"])
      if(customSession.get(data.userid)["remainingChunks"]!=0){
      socket.emit('nextChunk',customSession.get(data.userid)["remainingChunks"]);
      }else{
        socket.emit("finish");
      }
    }
  })

  socket.on('end', function (userid) {
    // console.log("end event number of parts :::: ", data);
    if (socket.handshake.session.userdata) {
      delete socket.handshake.session.userdata;
      socket.handshake.session.save();
    }
    if (userid) {
      let finalResult = customSession.delete(userid);
      console.log("finally the user was removed from map ", finalResult)
    }
    //delete socket.handshake.cookies;
    // console.log('session cookie', socket.Session);
    // console.log('session cookie in end method ::: ', socket.handshake.session.userdata);
  })

});

server.listen(process.env.PORT || 3030);

server.on('listening', () => {
  console.log("server started at : 3030");
});
