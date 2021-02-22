var element = new Image;
var devtoolsOpen = false;
element.__defineGetter__("id", function () {
  devtoolsOpen = true; // This only executes when devtools is open.
});
setInterval(function () {
  devtoolsOpen = false;
  console.log(element);
  (devtoolsOpen ? alert("Close your dev tool") : "");
}, 1);

$(document).bind("contextmenu", function (e) {
  e.preventDefault();
});

$(document).keydown(function (e) {
  if (e.which === 123) {
    return false, Redirect();
  }
});

document.onkeydown = function (e) {
  if (e.which == 123) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'E'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.shiftKey && e.which == 'I'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.shiftKey && e.which == 'J'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'U'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'S'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'H'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'A'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'F'.charCodeAt(0)) {
    return false, Redirect();
  }
  if (e.ctrlKey && e.which == 'E'.charCodeAt(0)) {
    return false, Redirect();
  }
}

function Redirect() {
  window.location = "https://www.google.com";
}

if (document.addEventListener) {
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, false);
} else {
  document.attachEvent('oncontextmenu', function () {
    window.event.returnValue = false;
  });
}
