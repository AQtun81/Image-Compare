
// DOM element references
var IMGs = document.getElementById("IMGs");
var PreviewImage = document.getElementById("image");
var ViewName = document.getElementById("viewName");

// variables
var DragActive = false;
var DragOffsetX = 0;
var DragOffsetY = 0;
var ImageScale = 1;
var CursorPosX = 0;
var CursorPosY = 0;
var ActiveImageId = 0;

/* FUNCTIONS
----------------------------------------- */

// changes active image and updates file name
function SwitchImagePreview(i, name) {
  if (!PreviewImage.children[i]) return;
  for (const child of PreviewImage.children) {
    child.style.opacity = 0;
  }
  PreviewImage.children[i].style.opacity = 1;
  ViewName.innerText = name;
  ActiveImageId = i;
}

function UpdateImagePosition() {
  const PADDING = 100;

  // restrict to screen bounds
  var rect = PreviewImage.children[ActiveImageId].getBoundingClientRect();
  if (DragOffsetX > window.innerWidth - PADDING) DragOffsetX = window.innerWidth - PADDING;   // RIGHT
  if (DragOffsetX + rect.width < PADDING) DragOffsetX = -rect.width + PADDING;                // LEFT
  if (DragOffsetY > window.innerHeight - PADDING) DragOffsetY = window.innerHeight - PADDING; // BOTTOM
  if (DragOffsetY + rect.height < PADDING) DragOffsetY = -rect.height + PADDING;              // TOP

  // update position
  PreviewImage.style.translate = DragOffsetX + "px " + DragOffsetY + "px";
}

function DragImage(x, y) {
  if (!DragActive) return;

  DragOffsetX += x;
  DragOffsetY += y;

  UpdateImagePosition();
}

function ZoomImage(y) {

  // set scale
  var scaleDifference = 1.0;
  if (y > 0) {
    if (ImageScale <= 0.25) return;
    scaleDifference *= 0.9;
  } else {
    scaleDifference = 1.1;
  }
  ImageScale *= scaleDifference;

  // calculate image offset
  var rect = PreviewImage.children[ActiveImageId].getBoundingClientRect();
  var widthDifference = rect.width * scaleDifference - rect.width;
  var heightDifference = rect.height * scaleDifference - rect.height;

  var relativeCursorX = (CursorPosX - DragOffsetX) / rect.width;
  var relativeCursorY = (CursorPosY - DragOffsetY) / rect.height;

  // move image position by offset 
  DragOffsetX -= widthDifference * relativeCursorX;
  DragOffsetY -= heightDifference * relativeCursorY;
  UpdateImagePosition();

  // increase preview image scale
  PreviewImage.style.transform = "scale(" + ImageScale + ")";
}

/* FILE SELECTION DIALOGUE
----------------------------------------- */

// open file selection dialogue
var input = document.createElement('input');
input.type = 'file';
input.multiple = true;

// file selection dialogue change event
input.onchange = e => {
  document.getElementById("fileSelect").style.display = "none";

  // create elements responsible for image change
  for (let i = 0; i < e.target.files.length; i++) {
    var reader  = new FileReader();
    var files = e.target.files;
    reader.onload = function(event) {

      // create event flexbox div
      var div = document.createElement("div");
      div.setAttribute("id", i);
      div.setAttribute("name", files[i].name);
      IMGs.appendChild(div);

      // create image
      var img = document.createElement("img");
      img.setAttribute("src", event.target.result);
      PreviewImage.appendChild(img);

      div.addEventListener('mouseover', (e) => {
        SwitchImagePreview(div.attributes.id.value, div.attributes.name.value);
      });
   }
   reader.readAsDataURL(e.target.files[i]);
  }
}

document.getElementById("fileSelect").addEventListener('click', (event) => {
  // display file selection dialogue window
  input.click();
});


/* EVENTS
----------------------------------------- */

// drag active event
IMGs.addEventListener('mousedown', (event) => {
  DragActive = true;
});

// drag inactive event
IMGs.addEventListener('mouseup', (event) => {
  DragActive = false;
});

// mouse move event
IMGs.addEventListener('mousemove', (event) => {
  DragImage(event.movementX, event.movementY);
});

// mouse wheel event
IMGs.addEventListener('wheel', (event) => {
  ZoomImage(event.deltaY);
});

document.addEventListener('mousemove', (event) => {
  CursorPosX = event.clientX;
  CursorPosY = event.clientY;
});