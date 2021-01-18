// gobal var
let keySize, iterations, password
let darkMode = localStorage.getItem('darkMode')

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const btn = document.getElementById('btn')
const url = "http://localhost:3333/"
const maxSize = (1024 * 800).toString()
const sizeFile = getSize(maxSize)
const socket = io.connect(url, { transport: ['websocket'], secure: true });
let cName = "", currentStream, count = 1, closeVideo, takeSnap, videoRecorder, closeVideoFromStream, toSendPhoto, toSendVideo, tempData, moreThanOne = false, cameraArr, cameraRotate
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

if (darkMode === 'Dark') darkm();

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
    socket.emit("new-user", cName)
    $("#msg").attr("placeholder", "Message")
    return count += 1, $('#msg').val("")
  }
  let message = document.getElementById('msg').value.toString().toLowerCase()
  if (count === 2 && message !== "") {
    var pattern1 = /sticker/i
    var pattern2 = /gif/i
    if (message.match(pattern1)) {
      return socket.emit("chat", { message: message, handle: cName }), $('#msg').val("");
    }
    if (message.match(pattern2)) {
      return socket.emit("chat", { message: message, handle: cName }), $('#msg').val("");
    }
    if (message === 'lightmode') return lightm(), $('#msg').val("")

    if (message === 'darkmode') return darkm(), $('#msg').val("")

    if (message === 'file2upload') return file2Upload(), $('#msg').val("")

    if (message === 'cleartext') return $("#send").empty(), $('#msg').val("")

    if (message.split(" ").join("") === 'whoami') return alert("secondary", "This is public chat room")

    if (message.split(" ").join("") === 'opencamera') return openCamera(), $('#msg').val("")

    if (message.split(" ").join("") === 'audiorecorderstart') return audioStart(), $('#msg').val("")

    if (message.split(" ").join("") === 'shownew') return socket.emit("showNewfeature"), $('#msg').val("")

    else {
      let clean = validator.escape(message)
      var encrypted = encrypt(clean, password);
      socket.emit("chat", { message: encrypted, handle: cName });
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

socket.on("basic_need", data => {
  keySize = data.keySize
  iterations = data.iterations
  password = data.password
  basic_init(data.arr)
})

socket.on("chat", function (data) {
  var pattern = /sticker/i
  if (data.message.match(pattern)) {
    return $('#send').append(`<p class="dummy">${firstName(data.handle)} : ${data.url}  <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></p>`)
  } else {
    var decrypted = decrypt(data.message, password);
    return $('#send').append(`<p class="dummy">${firstName(data.handle)} : ${decrypted.toString(CryptoJS.enc.Utf8).toString()} <em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></p>`)
  }
});

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
    return $("#send").append(`<div class="dummy ">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp; <audio class="fileAudio" controls autobuffer="autobuffer"><source src="${url}"/></audio>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = []
  }

  if (data.sending === 'video') {
    let binaryData = [];
    binaryData.push(data.blob)
    let url = (window.URL || window.webkitURL).createObjectURL(new Blob(binaryData, { type: data.type }));
    return $("#send").append(`<div class="dummy ">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp;<video class="fileVideo" controls autobuffer="autobuffer"><source src="${url}"/></video>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = []
  }

  if (data.sending === 'image') {
    let binaryData = data.blob.substr(23, data.blob.length)
    let url = makeBlob(binaryData, data.type)
    return $("#send").append(`<div class="dummy">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp;<img class="imageClass" src="${url}"/>&nbsp;<a href="${url}" download><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`), binaryData = ""
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
    $("#send").append(`<div class="dummy">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp;<img class="imageClass" src="${makeBlob(data.buffer, data.type)}"/>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'text') {
    $("#send").append(`<div class="dummy addTextColor">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp;${data.fileName}&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'audio') {
    $("#send").append(`<div class="dummy ">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp; <audio class="fileAudio" controls autobuffer="autobuffer"><source src="${makeBlob(data.buffer, data.type)}"/></audio>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'video') {
    $("#send").append(`<div class="dummy ">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; : &nbsp;<video class="fileVideo" controls autobuffer="autobuffer"><source src="${makeBlob(data.buffer, data.type)}"/></video>&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

  if (data.tag === 'application') {
    $("#send").append(`<div class="dummy addTextColor">&nbsp;<span class="nameText">${firstName(data.handle)}</span>&nbsp; :&nbsp;${data.fileName}&nbsp;<a href="${makeBlob(data.buffer, data.type)}" download="${data.fileName}"><i class="fas fa-file-download"></i></a>&nbsp;<em>${(new Date()).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, })}</em></div>`)
  }

})

socket.on("disconnect", () => {
  $('#send').append(`<p class="dummy text-danger">User has left chat </p>`);
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
          var extraParams = { type: file.type ? file.type : "text/plain", tag: file.type.split('/')[0], extra: file.type.split('/').pop(), handle: cName };
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
  arr.forEach(ele => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.setAttribute("class", "text")
    a.innerText = ele
    li.appendChild(a)
    document.getElementById('myUL').appendChild(li)
  })
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
        socket.emit("blob", { blob: blob, handle: cName, type: blob.type, sending: "audio" })
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
      console.error(error);
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
  let div = document.createElement('div')
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
  var data = canvas.toDataURL('image/jpeg');
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
    $('#takeSnap').fadeOut()
    mediaRecorder.start()
  }

  function stopRecorderVideo(e) {
    mediaRecorder.stop()
    $('#takeSnap').fadeIn()
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
      let div = makeDiv('toSendVideo')
      videotag.setAttribute('class', 'recorderVideoStream')
      videotag.setAttribute("controls", "controls")
      $('#forVideoGrid').append(videotag)
      $('#forVideoGrid').append(div)
      closeVideoFromStream = document.getElementById('closeVideoFromStream')
      toSendVideo = document.getElementById('toSendVideo')
      return basicCallfucTwo()

    } else {
      alert("danger", `File less then ${sizeFile}`)
    }

  }
}

function toSendPhotofuc() {
  closeVideoFromStream = toSendPhoto = undefined
  socket.emit('blob', { blob: tempData, handle: cName, type: 'image/jpeg', sending: "image" })
  alert("success", "Photo is sent")
  return $('#forVideoGrid').empty(), tempData = '', stopMediaTracks(currentStream)
}

function toSendVideofuc() {
  closeVideoFromStream = toSendVideo = undefined
  socket.emit('blob', { blob: tempData, handle: cName, type: tempData.type, sending: "video" })
  alert("success", "Video is sent")
  return $('#forVideoGrid').empty(), tempData = '', stopMediaTracks(currentStream)
}

function closeVideoFromStreamfuc() {
  closeVideoFromStream = toSendPhoto = toSendVideo = undefined
  return $('#forVideoGrid').empty(), tempData = ''
}

function basicCall() {
  if (closeVideo !== undefined) closeVideo.addEventListener('click', closeVideofuc)
  if (takeSnap !== undefined) takeSnap.addEventListener('click', takeSnapfuc)
  if (videoRecorder !== undefined) videoRecorder.addEventListener('click', videoRecorderfuc)
}

function basicCallfucTwo() {
  if (toSendVideo !== undefined) toSendVideo.addEventListener('click', toSendVideofuc)
  if (toSendPhoto !== undefined) toSendPhoto.addEventListener('click', toSendPhotofuc)
  if (closeVideoFromStream !== undefined) closeVideoFromStream.addEventListener('click', closeVideoFromStreamfuc)
  closeVideo = takeSnap = videoRecorder = undefined
}

function makeDiv(data) {
  let div = document.createElement('div')
  return div.innerHTML = `<div class="option_controls">
            <div class="options" >
              <i class="fas fa-times" id="closeVideoFromStream"></i>
            </div>
            <div class="options" id="${data}">
            <i class="far fa-paper-plane"></i>
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