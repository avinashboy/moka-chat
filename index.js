// reuirement
const express = require("express"),
  cors = require('cors'),
  helmet = require("helmet"),
  dot = require('dotenv'),
  fetch = require('node-fetch'),
  dl = require('delivery'),
  fs = require('fs'),
  toobusy = require('toobusy-js'),
  rateLimit = require("express-rate-limit"),
  randomstring = require('randomstring')

const rooms = {}

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: "Too many room cann't be created from this IP, please try again after an hour"
});
dot.config()

// set up
const keySize = 512, iterations = 100, password = '!DV`3xQj)Skx=dJ#m=d'
const port = process.env.PORT || 3333
const appVersion = fs.readFileSync('./app-version.txt', 'utf8').split('&&')[0].split('=').pop()
const app = express();
const server = require('http').Server(app)
const options = {
  cors: true,
  origins: ["https://moka-chat.herokuapp.com/"]
}
const io = require("socket.io")(server, options);
// listern

server.listen(port, () => { console.log("port: ", port) })

app.use(express.static("public"));

// method
app.use(cors());
app.use(helmet());
app.use((req, res, next) => {
  if (toobusy()) return res.send(503, "Server Too Busy");
  next();
});

// router

app.get('/createroom', createAccountLimiter, (req, res) => {
  let { roomInfo } = req.query
  if (rooms[roomInfo] != null) return res.sendStatus(400)
  rooms[roomInfo] = {
    roomName: roomInfo,
    users: [],
    admin: [],
    key: randomstring.generate({ length: 19 })
  }
  res.json({ "room": `${roomInfo}` })
})

let alertmsg = [{ "0": "Show new" }]
let arr = [{ "0": "Gif", "1": "Gif=ross" }, { "0": "Sticker", "1": "Sticker=ross" }, { "0": "Darkmode", "1": "Lightmode" }, { "0": "File2upload" }, { "0": "Cleartext" }, { "0": "Audio recorder start" }, { "0": "Who am i" }, { "0": "Open Camera" }, { "0": "App Version" }, { "0": "Mapbox" }, { "0": "Create room", "1": "Show the room" }]

io.sockets.on("connection", function (socket) {
  let timeinn = (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, });
  console.log("socket made connection...", socket.id, timeinn);

  socket.emit("basic_need", { keySize, iterations, password, arr: makeArr(arr), appVersion })

  //socket.emit('alert', { newFeature: alertType(alertmsg), time: 1500 })
  //setInterval(() => { socket.emit("CheckMe") }, 9 * 1000)

  socket.on("showNewfeature", () => {
    socket.emit('alert', { newFeature: alertType(arr), time: 7000 })
  })

  socket.on("toShowTheRoom", () => {
    let basicArrayRoomList = []
    for (const [key, value] of Object.entries(rooms)) {

      let basicInfo = { roomName: value.roomName, users: value.users.length, admin: value.admin.length }
      basicArrayRoomList.push(basicInfo)
    }
    socket.emit("toShowTheRoomList", basicArrayRoomList)
  })

  socket.on("deleteList", data => {
    if (data.roomId !== undefined) return io.to(data.roomId).emit("deleteList", data.element)
    //io.emit("deleteList", data.element)
  })

  socket.on("blob", data => {
    if (data.roomId !== undefined) return io.to(data.roomId).emit('blob', data)
    // io.emit('blob', data)
  })

  socket.on("toCommonRoom", data => {
    //rooms[data.roomInfo].users.push({ id: socket.id, handle: data.handle })
    socket.join(data.roomInfo)
  })

  socket.on("toJoinHasUser", (data) => {
    if (rooms[data.newRoom] == null) return socket.emit("ErrorFromServer", { "msg": "No room" })
    if (rooms[data.newRoom].users.length === 0) {
      socket.broadcast.to(data.oldRoom).emit('yesIamLeaveTheGrp', { "msg": `${data.handle} left` })
      socket.leave(data.oldRoom)
      rooms[data.newRoom].users.push({ id: socket.id, user: data.handle })
      socket.join(data.newRoom)
      socket.broadcast.to(data.newRoom).emit('yesIamJoinTheGrp', { "msg": `${data.handle} join` })
      return socket.emit("toJoinHasUser", { key: rooms[data.newRoom].key, roomName: data.newRoom })
    }
    setInterval(() => {
      rooms[data.newRoom].users = rooms[data.newRoom].users.filter((users, index, self) =>
        index === self.findIndex((t) => (
          t.id === users.id && t.user === users.user
        ))
      )
    }, 1000)
    rooms[data.newRoom].users.forEach(forCheckUser => {
      if (forCheckUser.user.toLowerCase() !== data.handle.toLowerCase()) {
        if (rooms[data.oldRoom] !== undefined) {
          let tempCheckAdmin = rooms[data.oldRoom].admin
          tempCheckAdmin.forEach(AdminCheckIn => {
            if (AdminCheckIn.userAdmin === data.handle) return rooms[data.oldRoom].admin = [], socket.broadcast.to(data.oldRoom).emit("noAdminForThisGrp")
          })
        }
        socket.broadcast.to(data.oldRoom).emit('yesIamLeaveTheGrp', { "msg": `${data.handle} left` })
        socket.leave(data.oldRoom)
        rooms[data.newRoom].users.push({ id: socket.id, user: data.handle })
        socket.join(data.newRoom)
        socket.broadcast.to(data.newRoom).emit('yesIamJoinTheGrp', { "msg": `${data.handle} join` })
        return socket.emit("toJoinHasUser", { key: rooms[data.newRoom].key, roomName: data.newRoom })
      }
      return socket.emit("ErrorFromServer", { "msg": "Already join" })
    })



  })

  socket.on("toJoinTheRoomOnlyforAdmin", data => {
    socket.broadcast.to(data.oldRoom).emit('yesIamLeaveTheGrp', { "msg": `${data.handle} left` })
    socket.leave(data.oldRoom)
    socket.join(data.roomInfo)
    rooms[data.roomInfo].admin.push({ id: socket.id, userAdmin: data.handle })
    socket.emit("toJoinTheRoomOnlyforAdmin", rooms[data.roomInfo].key)
  })

  var delivery = dl.listen(socket);
  delivery.on('receive.success', function (file) {
    var params = file.params;
    if (params.roomId !== undefined) return io.to(params.roomId).emit("file", { fileName: file.name, buffer: file.buffer.toString('base64'), type: params.type, tag: params.tag, extra: params.extra, handle: params.handle, id: params.id })
    //io.emit("file", { fileName: file.name, buffer: file.buffer.toString('base64'), type: params.type, tag: params.tag, extra: params.extra, handle: params.handle, id: params.id })
  });

  socket.on("chat", async function (data) {
    var pattern1 = /sticker/i
    var pattern2 = /gif/i
    if (data.message.match(pattern1)) {
      const temp = await sendSticker(data.message)
      if (data.roomId !== undefined) return io.to(data.roomId).emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
      //return io.emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
    }
    if (data.message.match(pattern2)) {
      const temp = await sendGif(data.message)
      if (data.roomId !== undefined) return io.to(data.roomId).emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
      //return io.emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
    }
    else {
      if (data.roomId !== undefined) return io.to(data.roomId).emit("chat", data);
      //return io.emit("chat", data);
    }
  });

  socket.on('new-user', (data) => {
    socket.broadcast.to(data.roomName).emit("new-user", `New user is ${data.cName.charAt(0).toUpperCase() + data.cName.slice(1)}`)
  })

  socket.on('disconnect', () => {
    getUserRoom(socket).forEach((room) => {
      console.log('room disconnect:', room)

    })
  })
});

async function sendGif(info) {
  var x = Math.floor((Math.random() * 19) + 1)
  let url = ''
  const key = process.env.API_key
  var pattern = /=/i
  if (info.match(pattern)) {
    let name = info.split('=').pop()
    url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${name}&limit=20&offset=5&rating=g&random_id=e826c9fc5c929e0d6c6d423841a282aa`
  } else {
    url = `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=20&offset=5&rating=g&random_id=e826c9fc5c929e0d6c6d423841a282aa`
  }

  const res = await fetch(url)
  const html = await res.text()
  const obj = JSON.parse(html)
  const gifUrl = obj.data[x].images.downsized.url

  return `<img src="${gifUrl}}" style="height: 100px;width: 150px;">`
}

async function sendSticker(info) {
  var x = Math.floor((Math.random() * 19) + 1)
  let url = ''
  const key = process.env.API_key
  var pattern = /=/i
  if (info.match(pattern)) {
    let name = info.split('=').pop()
    url = `https://api.giphy.com/v1/stickers/search?api_key=${key}&q=${name}&limit=20&offset=5&rating=g&random_id=e826c9fc5c929e0d6c6d423841a282aa`
  } else {
    url = `https://api.giphy.com/v1/stickers/trending?api_key=${key}&limit=20&offset=5&rating=g&random_id=e826c9fc5c929e0d6c6d423841a282aa`
  }

  const res = await fetch(url)
  const html = await res.text()
  const obj = JSON.parse(html)
  const gifUrl = obj.data[x].images.downsized.url

  return `<img src="${gifUrl}}" style="height: 100px;width: 150px;">`
}

function alertType(arr) {
  let str = "Type: "
  for (const property in arr) {
    let number = Object.keys(arr[property]).length
    if (number === 2) {
      str += ` ${arr[property][0]} or ${arr[property][1]} |`
    } else if (number === 1) {
      str += ` ${arr[property][0]} |`
    }
  }
  return str.substring(0, (str.length - 1)) + "in message..."
}

function makeArr(arr) {
  let samllArr = []
  for (const [key, value] of Object.entries(arr)) {
    for (const [key2, value2] of Object.entries(value)) {
      samllArr.push(value2)
    }
  }
  return samllArr
}

function getUserRoom(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    room.users.forEach(removeArray => {
      if (removeArray.id === socket.id) names.push(removeArray.user), room.users.splice(room.users.findIndex(a => { a.id === socket.i }), 1)
    })

    room.admin.forEach(removeArrayAdmin => {
      if (removeArrayAdmin.id === socket.id) names.push(removeArrayAdmin.userAdmin), room.admin.splice(room.admin.findIndex(b => { b.id === socket.id }), 1)
    })

    return names;
  }, []);
}

setInterval(() => {
  for (const [key, value] of Object.entries(rooms)) {
    if (value.users.length === 0 || value.admin.length === 0) return delete rooms[value.roomName]
  }
}, 60 * 60 * 1000)