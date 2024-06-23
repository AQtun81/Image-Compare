
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
var TotalImageCount = 0;

/* FUNCTIONS
----------------------------------------- */

// changes active image and updates file name
function SwitchImagePreview(i, name) {
  if (DragActive) return;
  if (!PreviewImage.children[i]) return;
  for (const child of PreviewImage.children) {
    child.style.opacity = (child.attributes.id.value == i) ? 1 : 0
  }
  ViewName.innerText = name;
  ActiveImageId = i;
}

function SwitchImagePreviewFromCursorPosition() {
  if (PreviewImage.children.length <= 0) return;
  var element = document.elementFromPoint(CursorPosX, CursorPosY);
  SwitchImagePreview(element.attributes.id.value, element.attributes.name.value);
}

function UpdateImagePosition() {
  const PADDING = 100;
  if (PreviewImage.children.length < 1) return;

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
  if (PreviewImage.children.length < 1) return;

  // set scale
  var scaleDifference = 1.0;
  if (y > 0) {
    if (ImageScale <= 0.025) return;
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

// create input DOM element
var input = document.createElement('input');
input.type = 'file';
input.multiple = true;

function ProcessInput(files, isClipboard = false) {
  var fs = document.getElementById("fileSelect");
  fs.innerText = "Add more images";
  fs.classList.add("addMore");

  // create elements responsible for image change
  for (let i = 0; i < files.length; i++) {
    var reader  = new FileReader();
    reader.onload = function(event) {

      if (isClipboard) {
        CreateImage(`Clipboard ${TotalImageCount}`, TotalImageCount, event.target.result);
      } else {
        CreateImage(files[i].name, TotalImageCount, event.target.result);
      }

      TotalImageCount++;
   }
   reader.readAsDataURL(files[i]);
  }
}

function checkImage(url){
  const extensions = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".heif", ".heic", ".tiff", ".bmp"];
  var paramless = url.split('?')[0];
  for (let i = 0; i < extensions.length; i++) {
    if (paramless.endsWith(extensions[i])) return true;
  }
 
  return false;
}

function ProcessInputURL(url) {
  if (!checkImage(url)) return;
  CreateImage(url.split('?')[0].split('/').at(-1), TotalImageCount, url);
  TotalImageCount++;
}

function CreateImage(name, id, src) {
    // create event flexbox div
    var div = document.createElement("div");
    div.setAttribute("id", id);
    div.setAttribute("name", name);
    IMGs.appendChild(div);
  
    // create image
    var img = document.createElement("img");
    img.setAttribute("id", id);
    img.setAttribute("src", src);
    PreviewImage.appendChild(img);

    div.addEventListener('mouseover', (e) => {
      SwitchImagePreview(div.attributes.id.value, div.attributes.name.value);
    });
}

// choose files button event
input.onchange = e => ProcessInput(e.target.files);

// clipboard event
window.addEventListener('paste', e => {
  e.preventDefault();
  var str = e.clipboardData.getData("text");
  if (str != "") ProcessInputURL(str);
  ProcessInput(e.clipboardData.files, true);
});

// image drag and drop
window.addEventListener('drop', e => {
  e.preventDefault();
  var str = e.dataTransfer.getData("text");
  if (str != "") ProcessInputURL(str);
  ProcessInput(e.dataTransfer.files);
  SwitchImagePreviewFromCursorPosition();
});
document.addEventListener("dragover", function(event) {event.preventDefault();});

// display file selection dialogue window
document.getElementById("fileSelect").addEventListener('click', (event) => {input.click();});

/* EVENTS
----------------------------------------- */

// drag active event
IMGs.addEventListener('mousedown', (event) => {
  event.preventDefault();
  DragActive = true;
});

// drag inactive event
IMGs.addEventListener('mouseup', (event) => {
  event.preventDefault();
  DragActive = false;
  SwitchImagePreviewFromCursorPosition();
});

// mouse move event
IMGs.addEventListener('mousemove', (event) => {
  event.preventDefault();
  DragImage(event.movementX, event.movementY);
});

// mouse wheel event
IMGs.addEventListener('wheel', (event) => {
  event.preventDefault();
  ZoomImage(event.deltaY);
});

document.addEventListener('mousemove', (event) => {
  event.preventDefault();
  CursorPosX = event.clientX;
  CursorPosY = event.clientY;
});