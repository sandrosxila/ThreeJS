// set up gui

const gui = new dat.GUI();
gui.domElement.style.marginTop = '55px';

gui.add({Author:'Sandro Skhirtladze'},'Author');
gui.add({Title:'2D Segment Tree'},'Title');
gui.add({University:'FH Joanneum'},'University');
console.log(gui.domElement.childNodes[1].childNodes[0].childNodes[0].childNodes[1].childNodes[0]);
gui.domElement.childNodes[2].innerText="Close Credentials";
gui.domElement.childNodes[1].childNodes[0].childNodes[0].childNodes[1].childNodes[0].disabled = true;
gui.domElement.childNodes[1].childNodes[1].childNodes[0].childNodes[1].childNodes[0].disabled = true;
gui.domElement.childNodes[1].childNodes[2].childNodes[0].childNodes[1].innerHTML = "<img src='./logos/logo.png' width=\"75\" style=\"margin-top: 2px; margin-left:8px;\"></img>";
