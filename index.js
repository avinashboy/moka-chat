// reuirement
const express = require("express"),
  cors = require('cors'),
  helmet = require("helmet"),
  dot = require('dotenv'),
  fetch = require('node-fetch'),
  dl = require('delivery'),
  fs = require('fs'),
  toobusy = require('toobusy-js')

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

let alertmsg = [{ "0": "Show new" }]
let arr = [{ "0": "Gif", "1": "Gif=ross" }, { "0": "Sticker", "1": "Sticker=ross" }, { "0": "Darkmode", "1": "Lightmode" }, { "0": "File2upload" }, { "0": "Cleartext" }, { "0": "Audio recorder start" }, { "0": "Who am i" }, { "0": "Open Camera" }, { "0": "App Version" }, { "0": "Mapbox" }]

io.sockets.on("connection", function (socket) {
  let timeinn = (new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, });
  console.log("socket made connection...", socket.id, timeinn);

  socket.emit("basic_need", { keySize, iterations, password, arr: makeArr(arr), appVersion })

  //socket.emit('alert', { newFeature: alertType(alertmsg), time: 1500 })
  //setInterval(() => { socket.emit("CheckMe") }, 9 * 1000)

  socket.on("showNewfeature", () => {
    socket.emit('alert', { newFeature: alertType(arr), time: 7000 })
  })

  socket.on("deleteList", data => {
    io.emit("deleteList", data)
  })

  socket.on("blob", data => {
    io.emit('blob', data)
  })

  var delivery = dl.listen(socket);
  delivery.on('receive.success', function (file) {
    var params = file.params;
    io.emit("file", { fileName: file.name, buffer: file.buffer.toString('base64'), type: params.type, tag: params.tag, extra: params.extra, handle: params.handle, id: params.id })
  });

  socket.on("chat", async function (data) {
    var pattern1 = /sticker/i
    var pattern2 = /gif/i
    if (data.message.match(pattern1)) {
      const temp = await sendSticker(data.message)
      return io.emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
    }
    if (data.message.match(pattern2)) {
      const temp = await sendGif(data.message)
      return io.emit("chat", { handle: data.handle, message: "sticker", url: temp, id: data.id });
    }
    else {
      return io.emit("chat", data);
    }
  });

  socket.on('new-user', (userName) => {
    socket.broadcast.emit("new-user", `New user is ${userName.charAt(0).toUpperCase() + userName.slice(1)}`)
  })

  socket.on('disconnect', () => {
    console.log("user has left");
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