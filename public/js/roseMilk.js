// gobal var
let keySize, iterations, password, appVersion
let darkMode = localStorage.getItem('darkMode')

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const btn = document.getElementById('btn')
const url = document.URL
const maxSize = (1024 * 800).toString()
const sizeFile = getSize(maxSize)
const socket = io.connect(url, { transport: ['websocket'], secure: true });
let cName = "", currentStream, count = 1, closeVideo, takeSnap, videoRecorder, closeVideoFromStream, toSendPhoto, toSendVideo, toMakeGif, toRunMe, toSendGif, toSendMap, tempData, tempCords, moreThanOne = false, cameraArr, cameraRotate, toRemoveCameraIcon = false, deleteTrashArr = [], deleteItemsFromList, emojiIcons, closeEmojiBox, recentEmojiBox, emojiBox, stickerBox, contentBox, ShowError, recentList = [], isRommName = false, tempMyModal
let myRecorder = {
  objects: {
    context: null,
    stream: null,
    recorder: null
  }
}

if (prefersDarkScheme.matches) {
  darkm()
} else {
  lightm()
}
prefersDarkScheme.addListener(e => {
  if (prefersDarkScheme.matches) {
    return darkm()
  } else {
    return lightm()
  }
})

document.getElementById('msg').addEventListener('keyup', myFunction)
document.getElementById('msg').addEventListener('change', bye)

document.getElementById('msg').addEventListener('keyup', function (event) {
  if (event.keyCode === 13) {
    document.getElementById("btn").click();
    return;
  }
});

btn.addEventListener('click', init)

function init() {
  if (count === 1) {
    cName = document.getElementById('msg').value
    socket.emit("new-user", { cName, roomName })
    $("#msg").attr("placeholder", "Message")
    return count += 1, $('#msg').val(""), addEmojiSvg()
  }
  let message = document.getElementById('msg').value.toString().toLowerCase()
  if (count === 2 && message !== "") {

    var pattern1 = /sticker/i
    var pattern2 = /gif/i
    if (message.match(pattern1)) {
      return socket.emit("chat", { message: message, handle: cName, id: idnumber(), roomId: checkRoomName() }), $('#msg').val("");
    }
    if (message.match(pattern2)) {
      return socket.emit("chat", { message: message, handle: cName, id: idnumber(), roomId: checkRoomName() }), $('#msg').val("");
    }
    if (message === 'lightmode') return lightm(), $('#msg').val("")

    if (message === 'darkmode') return darkm(), $('#msg').val("")

    if (message === 'file2upload') return file2Upload(), $('#msg').val("")

    if (message === 'cleartext') return $("#send").empty(), $('#msg').val("")

    if (message.split(" ").join("") === 'whoami') return isRommNamefun()

    if (message.split(" ").join("") === 'createroom') return createroomfun(`${message.split(" ").join("")}`)

    if (message.split(" ").join("") === 'showtheroom') return ShowTheRoom()

    if (message.split(" ").join("") === 'appversion') return alert("secondary", `Web app version = ${appVersion}`), $('#msg').val("")

    if (message.split(" ").join("") === 'mapbox') return mapBox(), $('#msg').val("")

    if (message.split(" ").join("") === 'opencamera' && toRemoveCameraIcon === false) return openCamera(), $('#msg').val("")

    if (message.split(" ").join("") === 'audiorecorderstart') return audioStart(), $('#msg').val("")

    if (message.split(" ").join("") === 'shownew') return socket.emit("showNewfeature"), $('#msg').val("")

    else {
      if (validator.isURL(message)) return axios.post("https://abts-link-preview.herokuapp.com/api", { Url: message }).then(res => { socket.emit("chat", { message: "linkPreview", handle: cName, id: idnumber(), info: res.data.result, roomId: checkRoomName() }) }), $('#msg').val("")
      let clean = validator.escape(message)
      var encrypted = encrypt(clean, password);
      socket.emit("chat", { message: encrypted, handle: cName, id: idnumber(), roomId: checkRoomName() });
    }
    $('#msg').val("")
  }
}

function encrypt(msg, pass) {
  var salt = CryptoJS.lib.WordArray.random(128 / 8);

  var key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  });

  var iv = CryptoJS.lib.WordArray.random(128 / 8);

  var encrypted = CryptoJS.AES.encrypt(msg, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC

  });

  var transitmessage = salt.toString() + iv.toString() + encrypted.toString();
  return transitmessage;
}

function decrypt(transitmessage, pass) {
  var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
  var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
  var encrypted = transitmessage.substring(64);

  var key = CryptoJS.PBKDF2(pass, salt, {
    keySize: keySize / 32,
    iterations: iterations
  });

  var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC

  })
  return decrypted;
}

socket.on("CheckMe", () => { if (!cName) return location.reload(); })

socket.on("noAdminForThisGrp", () => { alert("warning", "No admin") })

socket.on("toJoinTheRoomOnlyforAdmin", (data) => { isRommName = true, password = data })

socket.on("basic_need", data => {
  keySize = data.keySize
  iterations = data.iterations
  password = data.password
  appVersion = data.appVersion
  basic_init(data.arr)
})

socket.on("ErrorFromServer", data => {
  alert("danger", data.msg)
})

socket.on("toJoinHasUser", (data) => {
  roomName = data.roomName
  password = data.key
  isRommName = true
})

socket.on("toShowTheRoomList", (basicArrayRoomList) => getListForRoom(basicArrayRoomList))

socket.on("yesIamLeaveTheGrp", data => {
  alert("danger", data.msg)
})

socket.on("yesIamJoinTheGrp", data => {
  alert("info", data.msg)
})

socket.on("chat", function (data) {
  var pattern = /sticker/i
  if (data.message.match(pattern)) return $('#send').append(`<p class="dummy" id="${data.id}">${firstName(data.handle)} : ${data.url}  <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></p>`)

  if (data.message === 'linkPreview') {
    return $('#send').append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; : ${linkPreviewClass(data.info[0].image, data.handle, data.info[0].title, data.info[0].description, data.info[0].url)} <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.message === 'client side') {
    return $('#send').append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; : <img class="stickerImg" src="${data.stickerUrl}"> <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }
  var decrypted = decrypt(data.message, password);
  return $('#send').append(`<p class="dummy" id="${data.id}">${firstName(data.handle)} : ${decrypted.toString(CryptoJS.enc.Utf8).toString()} <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></p>`)

});

socket.on("deleteList", data => {
  return $(`#${data}`).remove()
})

socket.on('alert', (data) => {
  return $('#alert').fadeIn(1500),
    $('#alert').html(`<div class="alert alert-primary" role="alert">${data.newFeature}</div>`),
    setTimeout(() => { $('#alert').fadeOut(1000).empty() }, data.time)
})

socket.on('blob', data => {
  if (data.sending === 'audio') {
    let binaryData = [];
    binaryData.push(data.blob)
    let url = (window.URL || window.webkitURL).createObjectURL(new Blob(binaryData, { type: data.type }));
    return $("#send").append(`<div class="dummy " id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp; <audio class="fileAudio" controls autobuffer="autobuffer"><source src="${url}"/></audio>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = []
  }

  if (data.sending === 'video') {
    let binaryData = [];
    binaryData.push(data.blob)
    let url = (window.URL || window.webkitURL).createObjectURL(new Blob(binaryData, { type: data.type }));
    return $("#send").append(`<div class="dummy " id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<video class="fileVideo" controls autobuffer="autobuffer"><source src="${url}"/></video>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = []
  }

  if (data.sending === 'image') {
    let binaryData = data.blob.substr(23, data.blob.length)
    let url = makeBlob(binaryData, data.type)
    return $("#send").append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<img class="imageClass" src="${url}" alt='${firstName(data.handle)}'/>&nbsp;<a href="${url}" download><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em><div id="myModalImg" class="modalPreview"><span class="closePreview">&times;</span><img class="modal-content-preview"><div id="captionPreview"></div></div></div>`), binaryData = ""
  }

  if (data.sending === 'gif') {
    let binaryData = data.blob.substr(22, data.blob.length)
    let url = makeBlob(binaryData, data.type)
    return $("#send").append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<img class="gifClass" src="${url}"/>&nbsp;<a href="${url}" download><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = ""
  }

  if (data.sending === 'map') {
    let temCords = decrypt(data.type, password).toString(CryptoJS.enc.Utf8).toString()
    let url = makeBlob(data.blob.substr(22, data.blob.length), data.extra)
    return $("#send").append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<img id="mapImage" src="${url}" alt='${firstName(data.handle)}&3&${temCords}' />&nbsp;&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em><div id="myModalImg" class="modalPreview"><span class="closePreview">&times;</span><div id="mapPreview" class="modal-content-preview"></div><div id="captionPreview"></div></div></div>`)
  }

})

socket.on('new-user', (data) => {
  $('#newUser').append(`<p class="dummy text-info">${data}</p>`);
  setTimeout(() => {
    $('#newUser').html(' ')
  }, 4000)
})

socket.on('file', data => {
  if (data.tag === 'image') {
    $("#send").append(`<div class="dummy" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<img class="imageClass" src="${makeBlob(data.buffer, data.type)}" alt='${firstName(data.handle)}'/>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em><div id="myModalImg" class="modalPreview"><span class="closePreview">&times;</span><img class="modal-content-preview"><div id="captionPreview"></div></div></div>`)
  }

  if (data.tag === 'text') {
    $("#send").append(`<div class="dummy addTextColor" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;${data.fileName}&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'audio') {
    $("#send").append(`<div class="dummy " id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp; <audio class="fileAudio" controls autobuffer="autobuffer"><source src="${makeBlob(data.buffer, data.type)}"/></audio>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'video') {
    $("#send").append(`<div class="dummy " id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;<video class="fileVideo" controls autobuffer="autobuffer"><source src="${makeBlob(data.buffer, data.type)}"/></video>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'application') {
    $("#send").append(`<div class="dummy addTextColor" id="${data.id}">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp;<span class="scopeColor">:</span>&nbsp;${data.fileName}&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

})

socket.on("disconnect", () => {
  return $('#send').append(`<p class="dummy text-danger">You left the chat </p>`), location.reload(), removeAllRunningVar();
})

function firstName(data) {
  let tempname = data === cName ? 'you' : data;
  return tempname.charAt(0).toUpperCase() + tempname.slice(1);
}

function makeBlob(data, type) {
  let blob = b64toBlob(data, type);
  return (window.URL || window.webkitURL).createObjectURL(blob);
}

function lightm() {
  localStorage.setItem('darkMode', 'Light');
  darkMode = localStorage.getItem('darkMode');
  document.documentElement.setAttribute('data-theme', darkMode);
  trans();
}

function darkm() {
  localStorage.setItem('darkMode', 'Dark');
  darkMode = localStorage.getItem('darkMode');
  document.documentElement.setAttribute('data-theme', darkMode);
  trans();
}

function trans() {
  document.documentElement.classList.add('transition');
  window.setTimeout(() => {
    document.documentElement.classList.remove('transition');
  }, 1000);
};

function file2Upload() {
  $('#sendfile').click()
}

$(function () {
  socket.on('connect', function () {
    var delivery = new Delivery(socket);
    delivery.on('delivery.connect', function (delivery) {
      $("#sendfile").on('change', function (evt) {
        var file = $("#sendfile")[0].files[0];
        if (Number(maxSize) > file.size) {
          var extraParams = { type: file.type ? file.type : "text/plain", tag: file.type.split('/')[0], extra: file.type.split('/').pop(), handle: cName, id: idnumber(), roomId: checkRoomName() };
          delivery.send(file, extraParams);
        } else {
          alert("danger", `File less then ${sizeFile}`)
        }
        evt.preventDefault();
      });
    });

    delivery.on('send.success', function (fileUID) {
      alert("success", "File was successfully sent")
    });
  })
})

function basic_init(arr) {
  if (toRemoveCameraIcon) {
    const index = arr.indexOf("Open Camera");
    if (index > -1) arr.splice(index, 1);
  }
  arr.forEach(ele => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.setAttribute("class", "text")
    a.innerText = ele
    li.appendChild(a)
    document.getElementById('myUL').appendChild(li)
  })

  return socket.emit("toCommonRoom", { roomInfo: checkRoomName(), handle: cName })
}

$(document).on('click', '.text', function () {
  $("#msg").val($(this).text())
  $("#myUL").fadeOut()
})

function bye() {
  $("#myUL").fadeOut()
}

function myFunction() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("msg");
  var myul = document.getElementById("myUL");
  filter = input.value.toUpperCase();
  if (filter.length >= 3) {
    myul.style.display = "block"
    myul.children[0].style.display = "block"
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
      a = li[i].getElementsByTagName("a")[0];
      txtValue = a.textContent || a.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        li[i].style.display = "";

      } else {
        li[i].style.display = "none";
      }
    }

  } else {
    $("#myUL").fadeOut()
  }
}

function initStart() {
  if (null === myRecorder.objects.context) {
    myRecorder.objects.context = new (
      window.AudioContext || window.webkitAudioContext
    );
  }
}

function audioStart() {
  initStart()
  var options = { audio: true, video: false };
  navigator.mediaDevices.getUserMedia(options).then(function (stream) {
    myRecorder.objects.stream = stream;
    myRecorder.objects.recorder = new Recorder(
      myRecorder.objects.context.createMediaStreamSource(stream),
      { numChannels: 1 });
    myRecorder.objects.recorder.record();
    AudioRecorderTimer()
  }).catch(function (err) { });
}

function audioStop() {
  if (null !== myRecorder.objects.stream) {
    myRecorder.objects.stream.getAudioTracks()[0].stop();
  }
  if (null !== myRecorder.objects.recorder) {
    myRecorder.objects.recorder.stop();
    makeAudioFile(myRecorder)
  }
}

function makeAudioFile(myRecorders) {
  var listObjects = document.createElement('div')
  listObjects.setAttribute("id", "audio")
  $('#audioTemp').append(listObjects)
  var listObject = $('#audio')
  if (null !== listObject && 'object' === typeof listObject && listObject.length > 0) {
    myRecorders.objects.recorder.exportWAV(function (blob) {
      let bs = blob.size
      if (Number(maxSize) > bs) {
        socket.emit("blob", { blob: blob, handle: cName, type: blob.type, sending: "audio", id: idnumber(), roomId: checkRoomName() })
        $('#audioTemp').empty()
        alert("success", "Audio is sent")
        stopMediaTracks(myRecorders.objects.stream)
        myRecorder = { objects: { context: null, stream: null, recorder: null } }
      } else {
        alert("danger", "Audio recorder less than 5 sec")
      }
    });
  }
}

function AudioRecorderTimer() {
  let time = 5
  let timer = setInterval(() => {
    time -= 1
    if (time < 0) {
      clearInterval(timer)
      return audioStop(), $('#msg').val("")
    }
    $('#msg').val(time)
  }, 900)
}

function alert(className, message) {
  return $('#alert').fadeIn(),
    $('#alert').html(`<div class="alert alert-${className}" role="alert">${message}</div>`),
    setTimeout(() => { $('#alert').fadeOut(1000).empty() }, 5000)
}

function showNotificationCount(count) {
  const pattern = /^\(\d+\)/;

  if (count === 0 || pattern.test(document.title)) {
    document.title = document.title.replace(pattern, count === 0 ? "" : `(${count})`)
  } else {
    document.title = `(${count})`
  }
}

function getSize(maxSize) {

  if (maxSize.length === 7) {
    let str = `${maxSize.charAt(0)}`
    return `${str}mb`
  }

  if (maxSize.length === 8) {
    let str = maxSize.substring(0, 2)
    return `${str}mb`
  }

  if (maxSize.length === 9) {
    let str = maxSize.substring(0, 3)
    return `${str}mb`
  }


  if (maxSize.length === 6) {
    let str = maxSize.substring(0, 3)
    return `${str}kb`
  }
  if (maxSize.length === 5) {
    let str = maxSize.substring(0, 2)
    return `${str}kb`
  }

  if (maxSize.length === 4) {
    let str = maxSize.substring(0, 1)
    return `${str}kb`
  }

}

$(document).ready(function () {
  let list = navigator.mediaDevices.enumerateDevices().then(gotDevices)
  list.then(a => { checkList(a) })
});

function gotDevices(mediaDevices) {
  let listDevices = [];
  mediaDevices.forEach(mediaDevice => {
    if (mediaDevice.kind === 'videoinput') {
      let list = { label: mediaDevice.label, deviceId: mediaDevice.deviceId }
      listDevices.push(list)
    }
  });
  return listDevices
}

function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

function openCamera() {
  const forVideoGrid = document.getElementById('forVideoGrid')
  const MyVideo = document.createElement('video')
  MyVideo.muted = true

  let Value = $('#deviceId').val() || ""
  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
  }

  const videoConstraints = {};
  if (Value === '') {
    videoConstraints.facingMode = 'environment';
  } else {
    videoConstraints.deviceId = { exact: Value };
  }
  const constraints = {
    video: videoConstraints,
    audio: true
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      addVideoStream(MyVideo, stream, forVideoGrid)
      return navigator.mediaDevices.enumerateDevices();
    })
    .then(gotDevices)
    .catch(error => {
      alert("danger", `${error}`)
    });

}

function addVideoStream(video, stream, videoGrid) {
  video.srcObject = stream
  video.setAttribute('id', 'streamVideo')
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  let div = document.createElement('div')
  div.innerHTML = `<div class="option_controls">
  <div class="options" >
    <i class="fas fa-times" id="closeVideo"></i>
  </div>
  <div class="options" id="takeSnap">
    <i class="far fa-image"></i>
  </div>
  <div class="options" id="videoRecorder">
    <i class="fas fa-video"></i>
  </div>
</div>`
  videoGrid.append(video)
  videoGrid.append(div)
  closeVideo = document.getElementById('closeVideo')
  takeSnap = document.getElementById('takeSnap')
  videoRecorder = document.getElementById('videoRecorder')
  basicCall()
}

function checkList(a) {
  if (a.length === 1) return $('#deviceId').val(a[0].deviceId)
  if (a.length === 2) return moreThanOneCamera(a)
}

function moreThanOneCamera(a) {
  toRemoveCameraIcon = true
  let div = document.createElement('div')
  div.setAttribute('class', "forSvgs")
  let svg = `
  <svg fill="currentColor" id="rotate" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512"  xml:space="preserve">
    <path d="M451.267,144.067h-92.16c-2.56,0-5.12-1.707-5.12-3.413l-9.387-29.867c-3.413-11.093-13.653-17.92-24.747-17.92H191
      c-11.947,0-21.333,6.827-24.747,17.92l-9.387,29.867c-1.707,1.707-3.413,3.413-5.973,3.413h-92.16
      C25.453,144.067-1,170.52-1,203.8v153.6c0,33.28,26.453,59.733,59.733,59.733h392.533c33.28,0,59.733-26.453,59.733-59.733V203.8
      C511,170.52,484.547,144.067,451.267,144.067z M493.933,357.4c0,23.893-18.773,42.667-42.667,42.667H58.733
      c-23.893,0-42.667-18.773-42.667-42.667V203.8c0-23.893,18.773-42.667,42.667-42.667h92.16c10.24,0,17.92-5.973,22.187-15.36
      l9.387-29.867c1.707-3.413,5.12-5.973,8.533-5.973h128c4.267,0,7.68,2.56,8.533,5.973l10.24,30.72
      c3.413,8.533,11.947,14.507,21.333,14.507h92.16c23.893,0,42.667,18.773,42.667,42.667V357.4z"/>
    <path d="M297.667,333.507c-11.947,10.24-27.307,15.36-42.667,15.36c-37.547,0-68.267-30.72-68.267-68.267v-5.12l2.56,2.56
      c1.707,1.707,3.413,2.56,5.973,2.56s4.267-0.853,5.973-2.56c3.413-3.413,3.413-8.533,0-11.947l-15.607-15.606
      c-1.395-2.509-4.034-4.02-7.434-4.02s-6.038,1.511-7.434,4.02l-15.606,15.606c-3.413,3.413-3.413,8.533,0,11.947
      s8.533,3.413,11.947,0l2.56-2.56v5.12c0,46.933,38.4,85.333,85.333,85.333c19.627,0,38.4-6.827,53.76-19.627
      c3.413-2.56,3.413-8.533,0.853-11.947S301.08,330.947,297.667,333.507z"/>
    <path d="M342.893,266.093l-3.419,3.419c-5.855-41.331-41.594-73.392-84.475-73.392c-19.627,0-38.4,6.827-53.76,18.773
      c-3.413,2.56-3.413,8.533-0.853,11.947c2.56,3.413,8.533,3.413,11.947,0.853c11.947-10.24,26.453-15.36,42.667-15.36
      c33.013,0,60.738,23.752,66.955,55.009l-1.249-1.249c-3.413-3.413-8.533-3.413-11.947,0s-3.413,8.533,0,11.947l15.607,15.607
      c1.395,2.509,4.034,4.02,7.433,4.02c3.676,0,6.463-1.764,7.748-4.335l15.292-15.292c3.413-3.413,3.413-8.533,0-11.947
      S346.307,262.68,342.893,266.093z"/>
</svg>
  `
  div.innerHTML = svg
  $('.addCameraAdd').append(div)
  moreThanOne = true
  cameraArr = a
  return cameraRotate = document.getElementById('rotate'), forCamerafuc()
}

function closeVideofuc() {
  closeVideo = takeSnap = videoRecorder = null
  return stopMediaTracks(currentStream), $("#forVideoGrid").empty()
}

function takeSnapfuc() {
  let snapshot = document.getElementById('streamVideo')
  $("#forVideoGrid").empty()
  const canvas = document.createElement('canvas')
  const img = document.createElement('img')
  img.setAttribute('id', 'canvasImage')
  let width = height = 480
  var context = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  context.drawImage(snapshot, 0, 0, width, height);
  var data = canvas.toDataURL('image/webp');
  tempData = data
  let div = makeDiv('toSendPhoto')
  img.setAttribute("src", data)
  $('#forVideoGrid').append(img)
  $('#forVideoGrid').append(div)
  closeVideoFromStream = document.getElementById('closeVideoFromStream')
  toSendPhoto = document.getElementById('toSendPhoto')
  return basicCallfucTwo()
}

function videoRecorderfuc() {
  $('#videoRecorder').addClass("addRecorderColor")
  let chucks = []
  let mediaRecorder = new MediaRecorder(currentStream)

  startRecorderVideo()
  VideoRecorderTimer()
  function VideoRecorderTimer() {
    let time = 5
    let timer = setInterval(() => {
      time -= 1
      if (time < 0) {
        clearInterval(timer)
        return stopRecorderVideo(), $('#msg').val(""), $('#videoRecorder').removeClass("addRecorderColor")
      }
      $('#msg').val(time)
    }, 850)
  }
  function startRecorderVideo(e) {
    $('#takeSnap,#closeVideo').fadeOut()
    mediaRecorder.start()
  }

  function stopRecorderVideo(e) {
    mediaRecorder.stop()
    $('#takeSnap,#closeVideo').fadeIn()
  }

  mediaRecorder.ondataavailable = function (e) {
    chucks.push(e.data)
  }

  mediaRecorder.onstop = () => {
    stopMediaTracks(currentStream)
    $("#forVideoGrid").empty()
    let blob = new Blob(chucks, { 'type': 'video/ogg' })
    if (Number(maxSize) > blob.size) {
      chucks = []
      tempData = blob
      let videotag = document.createElement('video')
      let videoUrl = (window.URL || window.webkitURL).createObjectURL(blob)
      videotag.src = videoUrl
      let div = makeDivForGif('toSendVideo', 'toMakeGif')
      videotag.setAttribute('class', 'recorderVideoStream')
      videotag.setAttribute("controls", "controls")
      $('#forVideoGrid').append(videotag)
      $('#forVideoGrid').append(div)
      closeVideoFromStream = document.getElementById('closeVideoFromStream')
      toSendVideo = document.getElementById('toSendVideo')
      toMakeGif = document.getElementById('toMakeGif')
      return basicCallfucTwo()

    } else {
      alert("danger", `File less then ${sizeFile}`)
    }

  }
}

function toMakeGiffuc() {
  let { gifText, fontSize, fontColor } = ChoiceIsYour()
  $('#closeModal').click()
  if (validate(gifText)) return callFunction()
  if (gifText === '') return callFunction()
  return alert("danger", "Invalid")

  function callFunction() {
    gifshot.createGIF({
      gifWidth: 200,
      gifHeight: 200,
      video: tempData,
      interval: 0.1,
      numFrames: 10,
      frameDuration: 1,
      text: gifText,
      fontWeight: 'normal',
      fontSize: fontSize + 'px',
      fontFamily: 'sans-serif',
      fontColor: fontColor,
      textAlign: 'center',
      textBaseline: 'bottom',
      sampleInterval: 10,
      numWorkers: 2
    }, function (obj) {
      tempData = Selected = ''
      if (!obj.error) {
        $('#forVideoGrid').empty()
        let image = obj.image, animatedImage = document.createElement('img');
        animatedImage.src = image;
        animatedImage.setAttribute('class', 'recorderVideoStream')
        tempData = image
        let div = makeDiv('toSendGif')
        $('#forVideoGrid').append(animatedImage)
        $('#forVideoGrid').append(div)
        closeVideoFromStream = document.getElementById('closeVideoFromStream')
        toSendGif = document.getElementById('toSendGif')
        return basicCallfucTwo()
      } else {
        alert("danger", `${obj.error}`)
      }
    });
  }

}

async function toSendGiffuc() {
  closeVideoFromStream = toSendGif, toMakeGif = undefined
  await socket.emit('blob', { blob: tempData, handle: cName, type: 'image/gif', sending: "gif", id: idnumber(), roomId: checkRoomName() })
  alert("success", "Gif is sent")
  return $('#forVideoGrid').empty(), tempData = '', stopMediaTracks(currentStream)
}

async function toSendPhotofuc() {
  closeVideoFromStream = toSendPhoto = undefined
  await socket.emit('blob', { blob: tempData, handle: cName, type: 'image/jpeg', sending: "image", id: idnumber(), roomId: checkRoomName() })
  alert("success", "Photo is sent")
  return $('#forVideoGrid').empty(), tempData = '', stopMediaTracks(currentStream)
}

async function toSendVideofuc() {
  closeVideoFromStream = toSendVideo = undefined
  await socket.emit('blob', { blob: tempData, handle: cName, type: tempData.type, sending: "video", id: idnumber(), roomId: checkRoomName() })
  alert("success", "Video is sent")
  return $('#forVideoGrid').empty(), tempData = '', stopMediaTracks(currentStream)
}

async function toSendMapfuc() {
  let mapImage = tempData.getCanvas().toDataURL('image/png')
  await socket.emit('blob', { blob: mapImage, handle: cName, type: encrypt(tempCords, password), sending: "map", extra: "image/png", id: idnumber(), roomId: checkRoomName() })
  alert("success", "Map is sent")
  return tempCords = tempData = undefined, $('#forVideoGrid').empty()
}

function closeVideoFromStreamfuc() {
  closeVideoFromStream = toSendPhoto = toSendVideo = toSendGif, toRunMe, toSendMap = undefined
  return $('#forVideoGrid').empty(), tempData = ''
}

function toMakeModal() {
  $('.Modal-Container').html(`
  <div class="ModelsClass">
  <button type="button" id="btnHides" style="visibility: hidden;display:none"data-bs-toggle="modal" data-bs-target="#exampleModal">
  </button>
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Gif Parameter</h5>
        <button type="button" id="closeModal" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="gifText">GIF Text</label>
          <input name="gifText" id="gifText" class="form-control" value="" size="30" placeholder="Add text here..."></input>
        </div>
        
        <div class="mb-3">
          <label for="fontSize" class="form-label">Font Size</label>
          <input name="fontSize" id="fontSize" class="form-control" value="16" size="5" type="number"></input>
        </div>

        <div class="mb-3">
        <label for="fontColor">Font Color</label>
        <input type="color" name="fontColor" id="fontColor" class="form-control" value="#FFFFFF" size="5"></input>
        </div>
        
      </div>
      <div class="modal-footer" id="toRunMe">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>
</div>
  `)
  return toRunMe = document.getElementById('toRunMe')
}

function basicCall() {
  if (closeVideo !== undefined) closeVideo.addEventListener('click', closeVideofuc)
  if (takeSnap !== undefined) takeSnap.addEventListener('click', takeSnapfuc)
  if (videoRecorder !== undefined) videoRecorder.addEventListener('click', videoRecorderfuc)
  return toMakeModal()
}

function runButtonfuc() {
  return $('#btnHides').click()
}

function basicCallfucTwo() {
  if (contentBox !== undefined) contentBox.forEach(data => data.addEventListener('click', play))
  if (closeEmojiBox !== undefined) closeEmojiBox.addEventListener('click', closeEmojiBoxfuc)
  if (recentEmojiBox !== undefined) recentEmojiBox.addEventListener('click', recentEmojiBoxfuc)
  if (emojiBox !== undefined) emojiBox.addEventListener('click', emojiBoxfuc)
  if (stickerBox !== undefined) stickerBox.addEventListener('click', stickerBoxfuc)
  if (emojiIcons !== undefined) emojiIcons.addEventListener('click', emojiIconsfuc)
  if (deleteItemsFromList !== undefined) deleteItemsFromList.addEventListener('click', toBeDeleted)
  if (toSendVideo !== undefined) toSendVideo.addEventListener('click', toSendVideofuc)
  if (toSendMap !== undefined) toSendMap.addEventListener('click', toSendMapfuc)
  if (toSendGif !== undefined) toSendGif.addEventListener('click', toSendGiffuc)
  if (toMakeGif !== undefined) toMakeGif.addEventListener('click', runButtonfuc)
  if (toRunMe !== undefined) toRunMe.addEventListener('click', toMakeGiffuc)
  if (toSendPhoto !== undefined) toSendPhoto.addEventListener('click', toSendPhotofuc)
  if (closeVideoFromStream !== undefined) closeVideoFromStream.addEventListener('click', closeVideoFromStreamfuc)
  closeVideo = takeSnap = videoRecorder = undefined
}

function makeDiv(FirstName) {
  let div = document.createElement('div')
  return div.innerHTML = `<div class="option_controls">
            <div class="options" >
              <i class="fas fa-times" id="closeVideoFromStream"></i>
            </div>
            <div class="options" id="${FirstName}">
            <i class="far fa-paper-plane"></i>
            </div>
          </div>`
}

function makeDivForGif(FirstName, SecondName) {
  let div = document.createElement('div')
  return div.innerHTML = `<div class="option_controls">
            <div class="options" >
              <i class="fas fa-times" id="closeVideoFromStream"></i>
            </div>
            <div class="options" id="${FirstName}">
            <i class="far fa-paper-plane"></i>
            </div>
            <div class="options" id="${SecondName}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
      <path fill="currentColor" d="M13.177 12.013l-.001-.125v-.541-.512c0-.464 0-.827-.002-1.178a.723.723 0 0 0-.557-.7.715.715 0 0 0-.826.4c-.05.115-.072.253-.073.403-.003 1.065-.003 1.917-.002 3.834v.653c0 .074.003.136.009.195a.72.72 0 0 0 .57.619c.477.091.878-.242.881-.734.002-.454.003-.817.002-1.633l-.001-.681zm-3.21-.536a35.751 35.751 0 0 0-1.651-.003c-.263.005-.498.215-.565.48a.622.622 0 0 0 .276.7.833.833 0 0 0 .372.104c.179.007.32.008.649.005l.137-.001v.102c-.001.28-.001.396.003.546.001.044-.006.055-.047.081-.242.15-.518.235-.857.275-.767.091-1.466-.311-1.745-1.006a2.083 2.083 0 0 1-.117-1.08 1.64 1.64 0 0 1 1.847-1.41c.319.044.616.169.917.376.196.135.401.184.615.131a.692.692 0 0 0 .541-.562c.063-.315-.057-.579-.331-.766-.789-.542-1.701-.694-2.684-.482-2.009.433-2.978 2.537-2.173 4.378.483 1.105 1.389 1.685 2.658 1.771.803.054 1.561-.143 2.279-.579.318-.193.498-.461.508-.803.014-.52.015-1.046.001-1.578-.009-.362-.29-.669-.633-.679zM18 4.25H6A4.75 4.75 0 0 0 1.25 9v6A4.75 4.75 0 0 0 6 19.75h12A4.75 4.75 0 0 0 22.75 15V9A4.75 4.75 0 0 0 18 4.25zM21.25 15A3.25 3.25 0 0 1 18 18.25H6A3.25 3.25 0 0 1 2.75 15V9A3.25 3.25 0 0 1 6 5.75h12A3.25 3.25 0 0 1 21.25 9v6zm-2.869-6.018H15.3c-.544 0-.837.294-.837.839V14.309c0 .293.124.525.368.669.496.292 1.076-.059 1.086-.651.005-.285.006-.532.004-1.013v-.045l-.001-.46v-.052h1.096l1.053-.001a.667.667 0 0 0 .655-.478c.09-.298-.012-.607-.271-.757a.985.985 0 0 0-.468-.122 82.064 82.064 0 0 0-1.436-.006h-.05l-.523.001h-.047v-1.051h1.267l1.22-.001c.458-.001.768-.353.702-.799-.053-.338-.35-.56-.737-.561z"></path>
    </svg>
            </div>
          </div>`
}

function forCamerafuc() {
  if (cameraRotate !== undefined) cameraRotate.addEventListener('click', () => {
    $('#forVideoGrid').empty()
    if (moreThanOne) {
      moreThanOne = false
      $('#deviceId').val(cameraArr[0].deviceId)
      openCamera()
      document.getElementById("rotate").style.animation = "mymove 4s forwards";
    } else {
      moreThanOne = true
      $('#deviceId').val(cameraArr[1].deviceId)
      openCamera()
      document.getElementById("rotate").style.animation = "mymoveback 4s forwards";
    }
  })
}

function validate(nameValidate) {
  var regex = /^[a-zA-Z ]{2,30}$/;
  return regex.test(nameValidate);
}

function ChoiceIsYour() {
  return {
    gifText: $('#gifText').val(),
    fontSize: $('#fontSize').val(),
    fontColor: $('#fontColor').val(),
  }
}

$(document).on('click', '.imageClass', function () {
  let modalPreview = $(this).parent().children()[5]
  modalPreview.style.display = "block";
  let tempImg = modalPreview.children[1]
  tempImg.src = this.src;
  let tempClose = modalPreview.children[0]
  let tempCaption = modalPreview.children[2]
  tempCaption.innerHTML = this.alt
  tempClose.onclick = function () {
    modalPreview.style.display = "none";
  }
})

function mapBox() {
  if (navigator.geolocation) {
    var options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };
    $('#forVideoGrid').empty()
    $('#forVideoGrid').html(`<div id="mapBox"></div>`)
    let div = makeDiv('toSendMap')
    $('#forVideoGrid').append(div)
    closeVideoFromStream = document.getElementById('closeVideoFromStream')
    toSendMap = document.getElementById('toSendMap')
    navigator.geolocation.getCurrentPosition(showPosition, error, options);
    return basicCallfucTwo()
  } else {
    return alert("danger", "Geolocation is not supported by this browser.");
  }
  function error(err) {
    return alert("danger", `ERROR(${err.code}): ${err.message}`), axios.get('https://json.geoiplookup.io/').then(res => { return mapPreview(res.data.longitude, res.data.latitude, true, "mapBox") })
  }
  function showPosition(position) {
    let latitude = position.coords.latitude
    let longitude = position.coords.longitude
    mapPreview(longitude, latitude, true, "mapBox")
  }
}

async function mapPreview(longitude, latitude, IsBool, container) {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZmFrZWJveSIsImEiOiJja2o0NzlxanAzcGQwMnVyeHBhZnl4czZ4In0.ngroFVClyMt7ztPmYxgAoQ';
  var map = new mapboxgl.Map({
    container: container,
    style: `mapbox://styles/mapbox/${darkMode.toLowerCase() === 'light' ? "streets-v11" : "dark-v10"}`,
    center: [longitude, latitude],
    zoom: 1,
    preserveDrawingBuffer: true
  });
  const nav = new mapboxgl.NavigationControl()
  map.addControl(nav)
  let bounds = new mapboxgl.LngLatBounds();
  var marker = new mapboxgl.Marker({
    color: "#D93F3F",
    draggable: false
  }).setLngLat([longitude, latitude])
    .addTo(map)
  bounds.extend([longitude, latitude])
  map.fitBounds(bounds)
  if (IsBool) tempData = await map, tempCords = `${longitude}&&&${latitude}`
}

$(document).on('click', '#mapImage', function () {
  let modalPreview = $(this).parent().children()[4]
  let TempValue = this.alt.split('&3&')
  let TempCord = TempValue.pop().split("&&&")
  modalPreview.style.display = "block";
  let tempImg = modalPreview.children[1]
  $(tempImg).empty()
  let div = document.createElement('div')
  let id = makeid(5)
  div.setAttribute('id', id)
  div.setAttribute('class', 'mapBoxs')
  $(tempImg).append(div)
  mapPreview(Number(TempCord[0]), Number(TempCord[1]), false, id)
  let tempClose = modalPreview.children[0]
  let tempCaption = modalPreview.children[2]
  tempCaption.innerHTML = TempValue[0]
  tempClose.onclick = function () {
    modalPreview.style.display = "none";
  }
})

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

$(document).on('click', '.dummy', function () {
  if (!$(this).hasClass('bg_color')) return $(this).addClass('bg_color'), deleteTrashArr.push(this.id), deleteTrashArr.length >= 1 ? deleteTrashAdd() : deleteTrashRemove()
  $(this).removeClass('bg_color')
  const index = deleteTrashArr.indexOf(this.id);
  if (index > -1) deleteTrashArr.splice(index, 1);
  deleteTrashArr.length >= 1 ? deleteTrashAdd() : deleteTrashRemove()

})

function deleteTrashAdd() {
  return $('.deleteTrash').html(`<i class="fas fa-trash" id="deleteItemsFromList"></i>&nbsp;<span>${deleteTrashArr.length}</span>&nbsp;`), deleteItemsFromList = document.getElementById('deleteItemsFromList'), basicCallfucTwo()
}

function deleteTrashRemove() {
  return $('.deleteTrash').html(' ')
}

function idnumber() {
  return Math.random().toString(36).substring(7);
}

function toBeDeleted() {
  return deleteTrashArr.forEach(element => {
    if ($(`#${element}`).text().match(/you/i)) return socket.emit("deleteList", { element, roomId: checkRoomName() })
    $(`#${element}`).removeClass('bg_color')
  }), deleteTrashArr = [], deleteItemsFromList = undefined, deleteTrashRemove()
}

function linkPreviewClass(image, handle, title, description, url) {
  return `
  <div class="overAllLinkPreview">
  <div class="linkPreviewImage">
  <img src="${image}" alt="${handle}"/>
  </div>
  <div class="">
  <p class="LinkPreviewcard-title">${title} & ${truncate(description, 9)}....</p>
  <a href="${url}" class="LinkPreviewcard-link">Read More</a>
  </div>
  </div>
  `
}

function truncate(str, no_words) {
  return str.split(' ').splice(0, no_words).join(' ');
}

function addEmojiSvg() {
  let div = document.createElement('div')
  div.setAttribute("class", "addEmojiSvg")
  div.setAttribute("id", "emojiIcons")
  div.innerHTML = `
  <span data-testid="smiley" data-icon="smiley" class=""><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path></svg></span>
  `

  return $('.addCameraAdd').prepend(div), emojiIcons = document.getElementById('emojiIcons'), basicCallfucTwo()
}

function emojiIconsfuc() {
  let div = document.createElement('div')
  $('#emojiIcons').fadeOut()
  div.innerHTML = `
  <div class="mainBox">
  <div class="subBox">
    <div class="subBoxHeading">
      <div id="closeEmojiBox">
        <span data-testid="x" data-icon="x" class=""><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.1 17.2l-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path></svg></span>
      </div>
      <div id="recentEmojiBox">
        <span data-testid="panel-recent" data-icon="panel-recent" class=""><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.538 11.975a8.563 8.563 0 1 0-17.126 0 8.563 8.563 0 0 0 17.126 0zm1.412 0c0 5.509-4.466 9.975-9.975 9.975C6.465 21.95 2 17.484 2 11.975 2 6.465 6.466 2 11.975 2c5.509 0 9.975 4.466 9.975 9.975zm-9.832-5.27v5.692l4.386 2.627a.706.706 0 1 1-.725 1.212l-5.073-3.04v-6.49a.706.706 0 1 1 1.412 0z" fill="currentColor"></path></svg></span>
      </div>
      <div id="emojiBox">
        <span data-testid="smiley" data-icon="smiley" class=""><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path></svg></span>
      </div>
      <div id="stickerBox">
        <span data-testid="sticker" data-icon="sticker" class=""><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M21.799 10.183c-.002-.184-.003-.373-.008-.548-.02-.768-.065-1.348-.173-1.939a6.6 6.6 0 0 0-.624-1.87 6.24 6.24 0 0 0-1.171-1.594 6.301 6.301 0 0 0-1.614-1.159 6.722 6.722 0 0 0-1.887-.615c-.59-.106-1.174-.15-1.961-.171-.318-.008-3.607-.012-4.631 0-.798.02-1.383.064-1.975.17a6.783 6.783 0 0 0-1.888.616 6.326 6.326 0 0 0-2.785 2.753 6.658 6.658 0 0 0-.623 1.868c-.107.591-.152 1.186-.173 1.941-.008.277-.016 2.882-.016 2.882 0 .52.008 1.647.016 1.925.02.755.066 1.349.172 1.938.126.687.33 1.3.624 1.871.303.59.698 1.126 1.173 1.595a6.318 6.318 0 0 0 1.614 1.159 6.786 6.786 0 0 0 2.146.656c.479.068.833.087 1.633.108.035.001 2.118-.024 2.578-.035a6.873 6.873 0 0 0 4.487-1.811 210.877 210.877 0 0 0 2.928-2.737 6.857 6.857 0 0 0 2.097-4.528l.066-1.052.001-.668c.001-.023-.005-.738-.006-.755zm-3.195 5.92c-.79.757-1.784 1.684-2.906 2.716a5.356 5.356 0 0 1-2.044 1.154c.051-.143.116-.276.145-.433.042-.234.06-.461.067-.74.003-.105.009-.789.009-.789.013-.483.042-.865.107-1.22.069-.379.179-.709.336-1.016.16-.311.369-.595.621-.844.254-.252.542-.458.859-.617.314-.158.65-.268 1.037-.337a8.127 8.127 0 0 1 1.253-.106s.383.001.701-.003a4.91 4.91 0 0 0 .755-.066c.186-.034.348-.105.515-.169a5.35 5.35 0 0 1-1.455 2.47zm1.663-4.757a1.128 1.128 0 0 1-.615.859 1.304 1.304 0 0 1-.371.119 3.502 3.502 0 0 1-.52.043c-.309.004-.687.004-.687.004-.613.016-1.053.049-1.502.129a5.21 5.21 0 0 0-1.447.473 4.86 4.86 0 0 0-2.141 2.115 5.088 5.088 0 0 0-.479 1.434 9.376 9.376 0 0 0-.131 1.461s-.006.684-.008.777c-.006.208-.018.37-.043.511a1.154 1.154 0 0 1-.626.86c-.072.036-.168.063-.37.098-.027.005-.25.027-.448.031-.021 0-1.157.01-1.192.009-.742-.019-1.263-.046-1.668-.126a5.27 5.27 0 0 1-1.477-.479 4.823 4.823 0 0 1-2.127-2.1 5.141 5.141 0 0 1-.482-1.453c-.09-.495-.13-1.025-.149-1.71a36.545 36.545 0 0 1-.012-.847c-.003-.292.005-3.614.012-3.879.02-.685.061-1.214.151-1.712a5.12 5.12 0 0 1 .481-1.45c.231-.449.53-.856.892-1.213.363-.36.777-.657 1.233-.886a5.26 5.26 0 0 1 1.477-.479c.503-.09 1.022-.129 1.74-.149a342.03 342.03 0 0 1 4.561 0c.717.019 1.236.058 1.737.148a5.263 5.263 0 0 1 1.476.478 4.835 4.835 0 0 1 2.126 2.098c.228.441.385.913.482 1.453.091.499.131 1.013.15 1.712.008.271.014 1.098.014 1.235a2.935 2.935 0 0 1-.037.436z"></path></svg></span>
      </div>
    </div>
      <div class="contentBox" id="contentBox" >
      </div>
      <div id="ShowError"></div>
  </div>
</div>
  `
  return $('#forVideoGrid').append(div),
    closeEmojiBox = document.getElementById('closeEmojiBox'),
    recentEmojiBox = document.getElementById('recentEmojiBox'),
    emojiBox = document.getElementById('emojiBox'),
    stickerBox = document.getElementById('stickerBox'),
    contentBox = document.querySelectorAll('.contentBox'),
    ShowError = document.getElementById('ShowError'), basicCallfucTwo()
}

function closeEmojiBoxfuc() {
  return $('#emojiIcons').fadeIn(), $('#forVideoGrid').empty(), closeEmojiBox = recentEmojiBox = emojiBox = stickerBox = contentBox = ShowError = undefined
}

function recentEmojiBoxfuc() {
  $('#contentBox').empty()
  recentList.forEach(Element => {
    let h2 = `<h2 class="text-emoji" id="${idnumber()}">${Element}</h2>`
    $('#contentBox').append(h2)
  })
  if (recentList.length === 0) return $('#ShowError').text("You haven't used any emojis yet")
}

function emojiBoxfuc() {
  return axios.get("https://raw.githubusercontent.com/avinashboy/sticker/master/emoji.json").then(res => GettingData(res.data, "emoji"))
}

function stickerBoxfuc() {
  return axios.get("https://raw.githubusercontent.com/avinashboy/sticker/master/img.json").then(res => GettingData(res.data[0].data, "sticker"))
}

function GettingData(json, info) {
  $('#ShowError,#contentBox').empty()
  if (info === 'emoji') {
    $('#contentBox').css("grid-template-columns", "repeat(5, 1fr)")
    function em(gt) {
      if (gt.category !== 'People & Body') return `<h2 class="text-emoji" id="${idnumber()}">${gt.emoji}</h2>`;
    }
    return document.getElementById('contentBox').innerHTML = json.map(em).join('');
  }

  if (info === 'sticker') {
    $('#contentBox').css("grid-template-columns", "repeat(4, 1fr)")
    function ch(ss) {
      return `<img class="stickerImg" id="${idnumber()}" src="${ss.photo}">`;
    }
    return document.getElementById('contentBox').innerHTML = json.map(ch).join('');
  }
}

function play(e) {
  let check = $(`#${e.target.id}`).attr('class')

  if (check === 'text-emoji') {
    let h2 = document.getElementById(e.target.id).textContent
    console.log(recentList.indexOf(h2))
    if (recentList.indexOf(h2) == -1) recentList.push(h2)
    var text = document.getElementById('msg');
    text.value += h2
  }
  if (check === 'stickerImg') {
    let h2 = $(`#${e.target.id}`).attr('src')
    socket.emit("chat", { message: "client side", handle: cName, id: idnumber(), stickerUrl: h2, roomId: checkRoomName() });
  }
}

function removeAllRunningVar() {
  cName = "", count = 1;
  moreThanOne = toRemoveCameraIcon = isRommName = false
  currentStream = closeVideo = takeSnap = videoRecorder = closeVideoFromStream = toSendPhoto = toSendVideo = toMakeGif = toRunMe = toSendGif = toSendMap = tempData = tempCords = cameraArr = cameraRotate = deleteItemsFromList = emojiIcons = closeEmojiBox = recentEmojiBox = emojiBox = stickerBox = contentBox = ShowError = tempMyModal = roomName = undefined
  recentList = deleteTrashArr = []
}

function isRommNamefun() {
  return isRommName ? alert("secondary", `This is ${roomName} room`) : alert("secondary", "This is public chat room"), $("#msg").val('')
}

function createroomfun(message) {
  let roomInfo = validator.escape(prompt("Enter the room name"))
  if (roomInfo !== '' && roomInfo !== null) return axios.get(`${url}${message}?roomInfo=${roomInfo.toLowerCase()}`).then(res => { temp = roomName, roomName = res.data.room, $("#roomName").text(roomName), socket.emit("toJoinTheRoomOnlyforAdmin", { roomInfo: $("#roomName").text(), oldRoom: temp, handle: cName }) }).catch((err) => { alert("danger", "Sorry, something went wrong please again later") }), $('#msg').val("")

  return $('#msg').val(""), alert("danger", "Don't give empty room name")
}

function checkRoomName() {
  return roomName !== "public" ? roomName : "public"
}

function ShowTheRoom() {
  return socket.emit("toShowTheRoom"), $("#msg").val("")
}

function roomSvgFile() {
  return `<svg id="Icons" viewBox="0 0 74 74" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="m60.41 43.44a1 1 0 0 1 -1-1v-2.97a1 1 0 0 1 2 0v2.97a1 1 0 0 1 -1 1z"/><path d="m28.48 72a1 1 0 0 1 -1-1v-68a1 1 0 0 1 1.1-1l31.93 3.23a1 1 0 0 1 .9 1v16.33a1 1 0 1 1 -2 0v-15.426l-29.93-3.028v65.749l29.93-4.055v-16.36a1 1 0 0 1 2 0v17.23a1 1 0 0 1 -.865.991l-31.93 4.33a1.02 1.02 0 0 1 -.135.009z"/><path d="m60.41 33.47a1 1 0 0 1 -1-1v-2.91a1 1 0 0 1 2 0v2.91a1 1 0 0 1 -1 1z"/><path d="m13.659 68.306a1 1 0 0 1 -1-1v-61.106a1 1 0 0 1 1-1h14.82a1 1 0 0 1 0 2h-13.82v60.106a1 1 0 0 1 -1 1z"/><path d="m19.307 68.306a1 1 0 0 1 -1-1v-55.265a1 1 0 0 1 1-1h9.165a1 1 0 0 1 0 2h-8.165v54.265a1 1 0 0 1 -1 1z"/><path d="m28.472 68.306h-25.423a1 1 0 0 1 0-2h25.423a1 1 0 0 1 0 2z"/><path d="m70.951 68.306h-15.308a1 1 0 0 1 0-2h15.308a1 1 0 0 1 0 2z"/><path d="m35.42 40.614a3.614 3.614 0 1 1 3.614-3.614 3.618 3.618 0 0 1 -3.614 3.614zm0-5.228a1.614 1.614 0 1 0 1.614 1.614 1.616 1.616 0 0 0 -1.614-1.614z"/></svg>`

}

function userSvgFile() {
  return `
  <svg version="1.1" id="Capa_1" width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 511.999 511.999" style="enable-background:new 0 0 511.999 511.999;" xml:space="preserve">
  <g>
    <g>
      <path d="M438.09,273.32h-39.596c4.036,11.05,6.241,22.975,6.241,35.404v149.65c0,5.182-0.902,10.156-2.543,14.782h65.461
        c24.453,0,44.346-19.894,44.346-44.346v-81.581C512,306.476,478.844,273.32,438.09,273.32z"/>
    </g>
  </g>
  <g>
    <g>
      <path d="M107.265,308.725c0-12.43,2.205-24.354,6.241-35.404H73.91c-40.754,0-73.91,33.156-73.91,73.91v81.581
        c0,24.452,19.893,44.346,44.346,44.346h65.462c-1.641-4.628-2.543-9.601-2.543-14.783V308.725z"/>
    </g>
  </g>
  <g>
    <g>
      <path d="M301.261,234.815h-90.522c-40.754,0-73.91,33.156-73.91,73.91v149.65c0,8.163,6.618,14.782,14.782,14.782h208.778
        c8.164,0,14.782-6.618,14.782-14.782v-149.65C375.171,267.971,342.015,234.815,301.261,234.815z"/>
    </g>
  </g>
  <g>
    <g>
      <path d="M256,38.84c-49.012,0-88.886,39.874-88.886,88.887c0,33.245,18.349,62.28,45.447,77.524
        c12.853,7.23,27.671,11.362,43.439,11.362c15.768,0,30.586-4.132,43.439-11.362c27.099-15.244,45.447-44.28,45.447-77.524
        C344.886,78.715,305.012,38.84,256,38.84z"/>
    </g>
  </g>
  <g>
    <g>
      <path d="M99.918,121.689c-36.655,0-66.475,29.82-66.475,66.475c0,36.655,29.82,66.475,66.475,66.475
        c9.298,0,18.152-1.926,26.195-5.388c13.906-5.987,25.372-16.585,32.467-29.86c4.98-9.317,7.813-19.946,7.813-31.227
        C166.393,151.51,136.573,121.689,99.918,121.689z"/>
    </g>
  </g>
  <g>
    <g>
      <path d="M412.082,121.689c-36.655,0-66.475,29.82-66.475,66.475c0,11.282,2.833,21.911,7.813,31.227
        c7.095,13.276,18.561,23.874,32.467,29.86c8.043,3.462,16.897,5.388,26.195,5.388c36.655,0,66.475-29.82,66.475-66.475
        C478.557,151.509,448.737,121.689,412.082,121.689z"/>
    </g>
  </g>
  </svg>
  `
}

function adminSvgFile() {
  return `
  <svg version="1.1" id="Capa_1" width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 16.377 16.377" style="enable-background:new 0 0 16.377 16.377;" xml:space="preserve">
  <g>
    <g>
      <path style="fill:#030104;" d="M4.331,5.043c0.042,0.256,0.141,0.417,0.238,0.52c0.231,1.54,1.521,2.97,2.698,2.97
        c1.373,0,2.623-1.547,2.865-2.967c0.098-0.101,0.199-0.264,0.242-0.522c0.078-0.289,0.18-0.791,0.002-1.025
        c-0.01-0.012-0.02-0.023-0.029-0.034c0.166-0.606,0.377-1.858-0.375-2.711C9.906,1.188,9.486,0.686,8.585,0.42L8.158,0.271
        C7.45,0.052,7.004,0.004,6.986,0.001c-0.031-0.003-0.065,0-0.096,0.008C6.865,0.016,6.782,0.038,6.716,0.03
        C6.547,0.006,6.293,0.093,6.248,0.11c-0.06,0.023-1.43,0.573-1.846,1.849C4.363,2.063,4.197,2.605,4.418,3.936
        C4.385,3.958,4.355,3.985,4.33,4.019C4.152,4.253,4.252,4.754,4.331,5.043z M4.869,2.141C4.872,2.135,4.874,2.128,4.877,2.12
        c0.339-1.052,1.541-1.538,1.549-1.542c0.055-0.021,0.162-0.051,0.219-0.051c0.118,0.016,0.254-0.005,0.328-0.022
        C7.094,0.522,7.47,0.583,8.001,0.747l0.432,0.148c0.801,0.237,1.141,0.681,1.143,0.684c0.006,0.007,0.012,0.013,0.016,0.019
        c0.695,0.783,0.338,2.079,0.211,2.457C9.774,4.144,9.795,4.242,9.86,4.308c0.033,0.034,0.072,0.057,0.115,0.069
        C9.977,4.5,9.942,4.725,9.887,4.922C9.885,4.931,9.883,4.941,9.881,4.95C9.86,5.089,9.813,5.19,9.75,5.236
        c-0.053,0.04-0.09,0.101-0.1,0.167c-0.166,1.19-1.268,2.629-2.382,2.629c-0.938,0-2.055-1.325-2.213-2.624
        C5.047,5.34,5.012,5.279,4.956,5.238c-0.063-0.048-0.11-0.15-0.131-0.287c-0.001-0.01-0.003-0.02-0.006-0.029
        C4.768,4.739,4.735,4.53,4.732,4.404c0.047-0.005,0.094-0.021,0.134-0.053c0.074-0.058,0.11-0.152,0.092-0.245
        C4.683,2.662,4.869,2.141,4.869,2.141z"/>
      <path style="fill:#030104;" d="M12.224,9.363c-0.738-0.487-1.855-0.84-1.855-0.84C9.248,8.127,9.24,7.733,9.24,7.733
        c-2.203,4.344-3.876,0.014-3.876,0.014C5.21,8.333,2.941,9.021,2.941,9.021C2.278,9.275,1.998,9.657,1.998,9.657
        c-0.98,1.454-1.096,4.689-1.096,4.689c0.013,0.739,0.332,0.816,0.332,0.816c2.254,1.006,5.792,1.185,5.792,1.185
        c0.985,0.021,1.894-0.047,2.701-0.154c-0.773-0.723-1.262-1.748-1.262-2.887C8.464,11.192,10.134,9.465,12.224,9.363z"/>
      <path style="fill:#030104;" d="M12.269,9.963c-1.768,0-3.207,1.438-3.207,3.207c0,1.771,1.439,3.207,3.207,3.207
        c1.77,0,3.207-1.437,3.207-3.207C15.476,11.402,14.038,9.963,12.269,9.963z M12.058,14.747c-0.068,0.067-0.178,0.067-0.246,0
        l-1.543-1.555c-0.068-0.066-0.068-0.178,0-0.245l0.369-0.369c0.068-0.067,0.178-0.067,0.246,0l1.053,1.061l2.045-2.044
        c0.066-0.068,0.178-0.068,0.246,0l0.367,0.367c0.068,0.068,0.068,0.18,0,0.248L12.058,14.747z"/>
    </g>
  </g>
  </svg>
  `
}

function getListForRoom(basicArrayRoomList) {
  $('.Modal-Container').empty()
  let ul = document.createElement('ul')
  ul.setAttribute("class", "ulListOfRoom")
  if (basicArrayRoomList.length <= 0) return alert("warning", "There is no room")
  basicArrayRoomList.forEach(forRoom => {
    let li = document.createElement('li')
    li.setAttribute("class", "listOfRoom")
    li.innerHTML = `${roomSvgFile()}:&nbsp;${forRoom.roomName}&nbsp;&nbsp;${userSvgFile()}:&nbsp;${forRoom.users}&nbsp;&nbsp;${adminSvgFile()}:&nbsp;${forRoom.admin}&nbsp;&nbsp;<button id="joinTheRoom" value="${forRoom.roomName}" class="btn btn-outline-primary">Join</button>`
    ul.appendChild(li)
  })
  $('.Modal-Container').html(`
  <div class="modal" id="showTheList" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Show the list of room</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `)
  document.querySelector('.modal-body').appendChild(ul)
  tempMyModal = new bootstrap.Modal(document.getElementById('showTheList'), { keyboard: false })
  tempMyModal.show()
}

$(document).on('click', '#joinTheRoom', function () {
  tempMyModal.hide()
  socket.emit("toJoinHasUser", { oldRoom: roomName, handle: cName, newRoom: this.value })
})