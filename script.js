
// DOM element references
var IMGs = document.getElementById("IMGs");
var PreviewImage = document.getElementById("image");
var dropIndicator = document.getElementById("dropIndicator");

// variables
var DragActive = false;
var DragOffsetX = 0;
var DragOffsetY = 0;
var ImageScale = 1;
var CursorPosX = 0;
var CursorPosY = 0;
var ActiveImagePreviewElement = null;
var TotalImageCount = 0;
var DraggedTab = null;
var FileSelectInnerHTML = document.getElementById("fileSelect").innerHTML;

/* FUNCTIONS
----------------------------------------- */

// changes active image
function SwitchImagePreview(i) {
  if (DragActive) return;
  for (let j = 0; j < PreviewImage.children.length; j++) {
    if (PreviewImage.children[j].attributes.uid.value == i) {
      ActiveImagePreviewElement = PreviewImage.children[j];
      break;
    }
  }
  for (const child of PreviewImage.children) {
    child.style.opacity = (child.attributes.uid.value == i) ? 1 : 0;
  }
  for (const child of IMGs.children) {
    if (typeof child.attributes.uid === 'undefined') continue;
    if (child.attributes.uid.value == i) {
      child.classList.add("active");
    } else {
      child.classList.remove("active");
    }
  }
}

function SwitchImagePreviewFromCursorPosition() {
  var element = document.elementFromPoint(CursorPosX, CursorPosY);
  element = TopDataElement(element);
  if (typeof element.attributes.uid === 'undefined') return;
  SwitchImagePreview(element.attributes.uid.value);
}

function UpdateImagePosition() {
  const PADDING = 100;
  if (PreviewImage.children.length < 1) return;

  // restrict to screen bounds
  var rect = ActiveImagePreviewElement.getBoundingClientRect();
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
  var rect = ActiveImagePreviewElement.getBoundingClientRect();
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

function TopDataElement(element) {
  for (let i = 0; i < 10; i++) {
    if (typeof element.attributes.uid === 'undefined')
    {
      if (!element.parentElement) break;
      element = element.parentElement;
    } else {
      break;
    }
  }
  return element;
}

/* FILE SELECTION DIALOG
----------------------------------------- */

// create input DOM element
var input = document.createElement('input');
input.type = 'file';
input.multiple = true;

function ProcessInput(files, isClipboard = false) {
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
  
  ManageFileSelectDialog(0);
}

function ManageFileSelectDialog(t) {
  var fs = document.getElementById("fileSelect");
  if (t == 0) {
    fs.innerText = "";
    fs.classList.add("addMore");
    IMGs.appendChild(fs);
  } else if (IMGs.children.length <= t) {
    fs.innerHTML = FileSelectInnerHTML;
    fs.classList.remove("addMore");
    document.body.appendChild(fs);
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

  ManageFileSelectDialog(0);
}

function CreateImage(name, id, src) {
    // create event flexbox div
    var div = document.createElement("div");
    div.setAttribute("uid", id);
    div.setAttribute("name", name);
    var imageHeading = document.createElement("div");
    imageHeading.classList.add("imageName");
    imageHeading.setAttribute("draggable", true);
    imageHeading.addEventListener("dragstart", (e) => {
      DraggedTab = e.target;
      dropIndicator.style.display = "block";
      UpdateDropIndicator();
    });
    imageHeading.addEventListener("auxclick", (e) => {
      if (e.button == 1) {
        CloseImage(imageHeading);
      }
    });
    var imageName = document.createElement("input");
    imageName.value = name;
    imageName.addEventListener('mousedown', (e) => {
      if (e.button == 1) {
        e.preventDefault();
      }
    });
    var imageCloseButton = document.createElement("button");
    imageCloseButton.onclick = function(){CloseImage(imageCloseButton)};
    imageHeading.appendChild(imageName);
    imageHeading.appendChild(imageCloseButton);
    div.appendChild(imageHeading);
    IMGs.appendChild(div);
    IMGs.appendChild(document.getElementById("fileSelect"));
  
    // create image
    var img = document.createElement("img");
    img.setAttribute("uid", id);
    img.setAttribute("src", src);
    PreviewImage.appendChild(img);

    div.addEventListener('mouseover', (e) => {
      SwitchImagePreview(div.attributes.uid.value);
    });
}

/* EVENTS
----------------------------------------- */

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
  DragActive = false;

  var str = e.dataTransfer.getData("text");
  if (str != "")
  {
    ProcessInputURL(str);
  } else {
    ProcessInput(e.dataTransfer.files);
  }

  SwitchImagePreviewFromCursorPosition();

  if (DraggedTab) {
    if (!e.target) return;
    var target = TopDataElement(e.target);
    if (typeof target.attributes.uid === 'undefined') return;
    DraggedTab = TopDataElement(DraggedTab);

    if (DraggedTab.offsetLeft > target.offsetLeft) {
      IMGs.insertBefore(DraggedTab, target);
    } else {
      var targetPos = GetTabPosition(target.attributes.uid.value);
      IMGs.insertBefore(DraggedTab, IMGs.children[targetPos + 1]);
    }
    DraggedTab = null;
  }
});
document.addEventListener("dragover", function(event) {
  event.preventDefault();
  CursorPosX = event.clientX;
  CursorPosY = event.clientY;
});

// display file selection dialogue window
document.getElementById("fileSelect").addEventListener('click', (event) => {input.click();});

// drag active event
IMGs.addEventListener('mousedown', (event) => {
  DragActive = true;
});

// drag inactive event
IMGs.addEventListener('mouseup', (event) => {
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

/* TABS
----------------------------------------- */

function GetTabPosition(id) {
  for (let i = 0; i < IMGs.children.length; i++) {
    if (id == IMGs.children[i].attributes.uid.value) {
      return i;
    }
  }
  return -1;
}

function CloseImage(element) {
  element = TopDataElement(element);

  var id = element.attributes.uid.value;

  for (let i = 0; i < IMGs.childNodes.length - 1; i++) {
    if (IMGs.childNodes[i].attributes.uid.value == id) {
      IMGs.childNodes[i].remove();
    }
  }

  for (let i = 0; i < PreviewImage.childNodes.length; i++) {
    if (PreviewImage.childNodes[i].attributes.uid.value == id) {
      PreviewImage.childNodes[i].remove();
    }
  }

  ManageFileSelectDialog(1);
}

function UpdateDropIndicator() {
  if (!DraggedTab) {
    dropIndicator.style.display = "none";
    return;
  }

  for (let i = 0; i < IMGs.children.length - 1; i++) {
    const img = IMGs.children[i];
    if (IMGs.children[i + 1].offsetLeft > CursorPosX) {
      dropIndicator.style.left = (img.offsetLeft) + "px";
      break;
    }
  }

  requestAnimationFrame(UpdateDropIndicator);
}