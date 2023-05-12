
var tx = 0;
var ty = 0;
let scale = 1;
let el;
let drawer;

function setDrawer(el,drawer) {
  console.log("setDrawer:");
  this.drawer = drawer;
  this.el = el;
  el.onwheel = zoom;
}


function zoom(event) {
    console.log("event:", event);
    event.preventDefault();
    const dx = event.deltaX;
    const dy = event.deltaY;
    if (event.ctrlKey === false) {
    // pan
    //console.log("pan");
    // translate(42px, 18px)
    let direction = -1;
    tx += event.deltaX * direction;
    ty += event.deltaY * direction;
    transform();
    } else {
    // zoom
    //console.log("zoom");
    scale += dy * -0.01;
    // Restrict scale
    scale = Math.min(Math.max(0.125, scale), 4);
    // Apply scale transform
    transform();
    }
}

function transform() {
    let tcmd = `translate(${tx}px, ${ty}px)`;
    let scmd = `scale(${scale})`;
    console.log("tcmd:", tcmd);
    console.log("scmd:", scmd);
    this.drawer.style.transform = tcmd + " " + scmd;
}


/**------------------ DRAG ------------------- */

// dragElement(document.getElementById("mydiv"));
//dragElement(document.getElementsByClassName("move-div"));
  function dragElement(elmnt) {

      console.log(elmnt);
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;


      function dragMouseDown(e) {
        console.log("e.id", e.target.id)
        // if (e.target.id !== "mydiv") {
        //   return;
        // }

        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos_mouse_x = e.clientX;
        pos_mouse_y = e.clientY;
        const e_rect = e.target.getBoundingClientRect();
        console.log("e_rect.left:", e_rect.left, "e_rect.top:", e_rect.top);
        console.log("e_rect:", e_rect);
        console.log("pos_mouse_x:", pos_mouse_x, "pos_mouse_y:", pos_mouse_y);
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        console.log("---------------------------", e.target.id);
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        const drawer = document.getElementById("drawer");
        //var d_rect = drawer.getBoundingClientRect();
        //const e_rect = e.target.getBoundingClientRect();
        //console.log("e_rect.left:", e_rect.left, "e_rect.top:", e_rect.top);
        //var shift_x = d_rect.left / scale
        //var shift_y = d_rect.top / scale
        //console.log("shift_x:", shift_x);
        //var x = (e.clientX) / scale - shift_x
        //var y = (e.clientY) / scale - shift_y
        //console.log("scale:", scale);
        //console.log("pos_mouse_x:", pos_mouse_x, "pos_mouse_y:", pos_mouse_y);
        const delta_x = e.clientX - pos_mouse_x; // phisical
        const delta_y = e.clientY - pos_mouse_y;  // phisical
        pos_mouse_x = e.clientX;
        pos_mouse_y = e.clientY;
        //console.log("elmnt.style.left:", elmnt.style.left);
        //console.log("delta_x:", delta_x);
        pos_x = elmnt.offsetLeft + delta_x / scale;//pos_mouse_x/ scale - e.clientX/ scale - shift_x; // logic
        pos_y = elmnt.offsetTop + delta_y / scale;//pos_mouse_y/ scale - e.clientY/ scale - shift_y;
        //pos_y = ( e_rect.top + delta_y)/ scale;//pos_mouse_y/ scale - e.clientY/ scale - shift_y;
        console.log("pos_x:", pos_x, "pos_y:", pos_y);

        // set the element's new position:
        elmnt.style.top = pos_y + "px";//(elmnt.offsetTop - pos_y) + "px";
        elmnt.style.left = pos_x + "px"; //(elmnt.offsetLeft - pos_x) + "px";
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
  }

// const el = document.getElementById("container");
// const drawer = document.getElementById("drawer");
// el.onwheel = zoom;