import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r114/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.108.0/examples/jsm/controls/OrbitControls.js';
// import * as THREEx from 'http://jeromeetienne.github.io/threex.dynamictexture/threex.dynamictexture.js';
// import * as THREE from "./js/three.js"
// import {OrbitControls} from "./js/OrbitControls";

// initial setup

// set scene
let scene = new THREE.Scene();
// make scene background color white
scene.background = new THREE.Color('white');
// set up camera
let camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 26;
// create renderer
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// declare HSL function
function hsl(h, s, l) {
    return (new THREE.Color()).setHSL(h, s, l);
}
// declare addLight function
function addLight(...pos) {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...pos);
    scene.add(light);
}
// set lights
addLight(-1, 2, 4);
addLight(1, -1, -2);
// set orbit controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
//set up animation function
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
// set up font
let loader = new THREE.FontLoader();
let textFont = undefined;

function textLoaderPromise(){
    return new Promise(resolve => {
        loader.load('./font/helvetiker_regular.typeface.json', function (font) {
            resolve(font);
        });
    });
}

// object functions

// declare function that creates pipes between nodes
function makePipe(parent,height,positionX = 0,positionY = 0,positionZ = 0,radius = 0.1){
    let geometry = new THREE.CylinderBufferGeometry( radius, radius, height, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    let cylinder = new THREE.Mesh( geometry, material );
    parent.add( cylinder );
    cylinder.position.x = positionX;
    cylinder.position.y = positionY;
    cylinder.position.z = positionZ;
    return cylinder;
}
// declare the function that creates sphere
function makeSphere(color, parent, positionX, positionY, positionZ = 0, radius = 1, widthSegments = 32, heightSegments = 32) {
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({color: color, opacity: 0.2, transparent: true});
    const sphere = new THREE.Mesh(geometry, material);

    parent.add(sphere);

    sphere.position.x = positionX;
    sphere.position.y = positionY;
    sphere.position.z = positionZ;

    return sphere;
}
// make function that creates text object
function createText(font, text, color, fontSize, positionX, positionY, positionZ = 0) {
    const geometry = new THREE.TextBufferGeometry(text, {
        font: font,
        size: fontSize,
        height: 0.1,
        curveSegments: 4
    });
    const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        color: color
    });
    const TEXT = new THREE.Mesh(geometry, material);
    TEXT.position.x = positionX;
    TEXT.position.y = positionY;
    TEXT.position.z = positionZ;
    return TEXT;
}

async function makeText(text, parent, color, fontSize, positionX, positionY, positionZ = 0) {
    if (textFont === undefined) {
        textLoaderPromise().then(font => {
            const nodeTextObject = createText(font, text, color, fontSize, positionX, positionY, positionZ);
            textFont = font;
            parent.add(nodeTextObject);
        });
    } else {
        const nodeTextObject = createText(textFont, text, color, fontSize, positionX, positionY, positionZ);
        parent.add(nodeTextObject);
    }
}
// declare function that creates node
async function createNode (text,parent,positionX,positionY,positionZ = 0,lx,ly,rx,ry){
    let node = makeSphere(0x157d6c,parent, positionX,positionY,positionZ, 0.375 * text.length);
    let color = hsl(Math.random(), 1, 0.5);
    let textFontSize = 0.5;
    let rangeFontSize = 0.3;
    await makeText(text, node, color, textFontSize, -(0.1875 * text.length), -0.25, 0);
    if(lx === rx && ly === ry){
        let rangeText = "("+(lx).toString() + "," + (ly).toString()+")";
        await makeText(rangeText,node, color,0.3,-0.12 * rangeFontSize/textFontSize * rangeText.length,-node.geometry.parameters.radius - 0.5);
    }
    else{
        let rangeText = "[("+(lx).toString()+","+(ly).toString()+")-("+(rx).toString()+","+(ry).toString()+")]";
        await makeText(rangeText,node, color,0.3,-0.12 * rangeFontSize/textFontSize * rangeText.length,node.geometry.parameters.radius + 0.5);
    }
    return node;
}

function updateGeometry(text,child,lx,ly,rx,ry){
    // child.geometry.parameters.radius = 0.375 * text.length;
    child.geometry = new THREE.SphereGeometry(0.375 * text.length, 32, 32);
    // if(text === '6') console.log("here",child);
    let color = hsl(Math.random(), 1, 0.5);
    child.children[0] = createText(textFont, text, color,0.5, -(0.1875 * text.length), -0.25, 0);
    child.children[0].parent = child;
    let radius = child.geometry.parameters.radius;
    if(lx === rx && ly === ry){
        child.children[1].position.y = - radius - 0.5;
    }
    else{
        child.children[1].position.y = radius + 0.5;
    }
    child.children[1].material.color = color;
    // console.log(child.children[1]);
}

function updatePipe(child,parent,sideLength,height,direction,parentPipeIndex){
    if(parent !== null) {
        let parentRadius = parent.geometry.parameters.radius;
        let childRadius = child.geometry.parameters.radius;

        let totalDistance =  Math.sqrt((2 * sideLength * sideLength) + (height * height));
        let distance = totalDistance - childRadius - parentRadius;

        let childRadiusX = sideLength - (  (sideLength * childRadius) / totalDistance );
        let childRadiusY = height - ( (height * childRadius) / totalDistance );
        let childRadiusZ = sideLength - (  (sideLength * childRadius) / totalDistance );

        let parentRadiusX = (sideLength * parentRadius) / (totalDistance);
        let parentRadiusY = (height * parentRadius) / ( totalDistance );
        let parentRadiusZ = (sideLength * parentRadius) / (totalDistance);

        let newX = 0;
        let newY = 0;
        let newZ = 0;

        if (direction === "leftUp") {
            newX = -((childRadiusX + parentRadiusX) / 2);
            newY = -((childRadiusY + parentRadiusY) / 2);
            newZ = -((childRadiusZ + parentRadiusZ) / 2);
        } else if (direction === "leftDown") {
            newX = -((childRadiusX + parentRadiusX) / 2);
            newY = -((childRadiusY + parentRadiusY) / 2);
            newZ = (childRadiusZ + parentRadiusZ) / 2;
        } else if (direction === "rightUp") {
            newX = (childRadiusX + parentRadiusX) / 2;
            newY = -((childRadiusY + parentRadiusY) / 2);
            newZ = -((childRadiusZ + parentRadiusZ) / 2);
        } else if (direction === "rightDown") {
            newX = (childRadiusX + parentRadiusX) / 2;
            newY = -((childRadiusY + parentRadiusY) / 2);
            newZ = (childRadiusZ + parentRadiusZ) / 2;
        }
        parent.children[parentPipeIndex].geometry = new THREE.CylinderBufferGeometry( 0.1, 0.1, distance, 32 );
        parent.children[parentPipeIndex].parent = parent;
        parent.children[parentPipeIndex].position.x = newX;
        parent.children[parentPipeIndex].position.y = newY;
        parent.children[parentPipeIndex].position.z = newZ;
    }
}

function updateNode(text,child,parent,sideLength,height,direction,parentPipeIndex,lx,ly,rx,ry) {
    updateGeometry(text,child,lx,ly,rx,ry);
    updatePipe(child,parent,sideLength,height,direction,parentPipeIndex);
}
// node animation functions
// declare function that renders node movement
async function animateNode(node,finalX,finalY,finalZ,rate = 0.1){
    if (node !== undefined){
        if(node.position.x < finalX ) node.position.x = Math.min(node.position.x+rate, finalX);
        else node.position.x = Math.max(node.position.x-rate, finalX);
        if(node.position.y < finalY ) node.position.y = Math.min(node.position.y+rate, finalY);
        else node.position.y = Math.max(node.position.y-rate, finalY);
        if(node.position.z < finalZ ) node.position.z = Math.min(node.position.z+rate, finalZ);
        else node.position.z = Math.max(node.position.z-rate, finalZ);
    }
    controls.update();
    renderer.render(scene, camera);
    if(node.position.x !== finalX || node.position.y!== finalY || node.position.z!==finalZ)
        requestAnimationFrame(animateNode.bind(this,node,finalX,finalY,finalZ,rate));
}
// Left-Up
async function moveLeftUp(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate){
    await animateNode(child,-sideLength,-height,-sideLength, rate);
    let pipe = makePipe(parent,distance,-((childRadiusX+parentRadiusX)/2),-((childRadiusY+parentRadiusY)/2),-((childRadiusZ+parentRadiusZ)/2));
    pipe.rotation.x = 0;
    pipe.rotation.y = 3 * Math.PI / 4;
    pipe.rotation.z = Math.PI/2 - Math.atan(height / (sideLength * Math.sqrt(2)));
}
// Left-Down
async function moveLeftDown(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate){
    await animateNode(child,-sideLength,-height,sideLength, rate);
    let pipe = makePipe(parent,distance,-((childRadiusX+parentRadiusX)/2),-((childRadiusY+parentRadiusY)/2),(childRadiusZ+parentRadiusZ)/2);
    pipe.rotation.x = 0;
    pipe.rotation.y = - 3 * Math.PI / 4 ;
    pipe.rotation.z = Math.PI/2 - Math.atan(height / (sideLength * Math.sqrt(2)));
}
// Right-Up
async function moveRightUp(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate){
    await animateNode(child,sideLength,-height,-sideLength, rate);
    let pipe = makePipe(parent,distance,(childRadiusX+parentRadiusX)/2,-((childRadiusY+parentRadiusY)/2),-((childRadiusZ+parentRadiusZ)/2));
    pipe.rotation.x = 0;
    pipe.rotation.y = Math.PI / 4;
    pipe.rotation.z = Math.PI/2 - Math.atan(height / (sideLength * Math.sqrt(2)));
}
// Right-Down
async function moveRightDown(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate){
    await animateNode(child,sideLength,-height,sideLength, rate);
    let pipe = makePipe(parent,distance,(childRadiusX+parentRadiusX)/2,-((childRadiusY+parentRadiusY)/2),(childRadiusZ+parentRadiusZ)/2);
    pipe.rotation.x = 0;
    pipe.rotation.y = - Math.PI / 4;
    pipe.rotation.z = Math.PI/2 - Math.atan(height / (sideLength * Math.sqrt(2)));
}
// creating function that make node movements
async function moveNode(child,parent,sideLength,height,direction,rate){
    // console.log(sideLength,height);
    let parentRadius = parent.geometry.parameters.radius;
    let childRadius = child.geometry.parameters.radius;

    let totalDistance =  Math.sqrt((2 * sideLength * sideLength) + (height * height));
    let distance = totalDistance - childRadius - parentRadius;

    let childRadiusX = sideLength - (  (sideLength * childRadius) / totalDistance );
    let childRadiusY = height - ( (height * childRadius) / totalDistance );
    let childRadiusZ = sideLength - (  (sideLength * childRadius) / totalDistance );

    let parentRadiusX = (sideLength * parentRadius) / (totalDistance);
    let parentRadiusY = (height * parentRadius) / ( totalDistance );
    let parentRadiusZ = (sideLength * parentRadius) / (totalDistance);
    // console.log(childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ);
    if(direction === "leftUp")
        await moveLeftUp(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate);
    else if (direction === "leftDown")
        await moveLeftDown(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate);
    else if (direction === "rightUp")
        await moveRightUp(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate);
    else if (direction === "rightDown")
        await moveRightDown(child,sideLength,height,parent,distance,childRadiusX,childRadiusY,childRadiusZ,parentRadiusX,parentRadiusY,parentRadiusZ,rate);
}
let sphere;
let pipe,line,parent;
const addSlowBtn = document.getElementById("add-slow");
const addFastBtn = document.getElementById("add-fast");
const addAllBtn = document.getElementById("add-all");
const backBtn = document.getElementById("back");
const buildBtn = document.getElementById("build");
function addSlow(i,j,N,M,timeDelay){
            if (i < N) {
                if (j < M) {
                    let updateHandler;
                    let nodeAddition = setInterval( async () => {
                        if(updateHandler === undefined)
                            updateHandler = await update(ROOT, A[i][j], j + 1, i + 1,true);
                        else{
                            if (updateHandler === 0) {
                                clearInterval(nodeAddition);
                            }
                            else updateHandler = await updateHandler();
                        }
                    },timeDelay);
                }
            }
}

async function addFast(i,j,N,M){
    if(i < N){
        if(j < M){
            await update(ROOT,A[i][j],j+1,i+1);
        }
    }
}
let i = 0 , j = 0;
let leafs = [];
addSlowBtn.addEventListener("click", async() => {
    if(i < N) {
        addSlow(i, j, N, M, 3000);
        j++;
        if (j === M) {
            i++;
            j = 0;
        }
    }
});
addFastBtn.addEventListener("click", async() => {
    if(i < N) {
        await addFast(i, j, N, M);
        j++;
        if (j === M) {
            i++;
            j = 0;
        }
    }
});
addAllBtn.addEventListener("click",async () => {
    for(let i = 0; i < N; i++){
        for(let j = 0; j < M; j++){
            await update(ROOT, A[i][j], j + 1, i + 1);
        }
    }
});
backBtn.addEventListener("click",async() =>{
    console.log(leafs);
    if(leafs.length !== 0){
        j--;
        if(j<0){
            j+=M;
            i--;
        }
        undo(ROOT,A[i][j],j+1,i+1);
    }
});
buildBtn.addEventListener("click",async () => {
    for(let i = 0; i < N; i++){
        for(let j = 0; j < M; j++){
            build(ROOT, A[i][j], j + 1, i + 1);
        }
    }
    await drawTree(ROOT);
    console.log(ROOT);
});
animate();


// algorithm implementation
// node class
class Node{
    constructor(parent = null, isEmpty = true, data = 0, leftUp = null, leftDown = null, rightUp = null, rightDown = null, nodeObject = null, parentPipeIndex = 0) {
        this.isEmpty = isEmpty;
        this.parent = parent;
        this.data = data;
        this.leftUp = leftUp;
        this.leftDown = leftDown;
        this.rightUp = rightUp;
        this.rightDown = rightDown;
        this.nodeObject = nodeObject;
        this.parentPipeIndex = parentPipeIndex;
    }
}
// constants and variables
const N = 9;
const M = 12;
const A = [
    [1,2,3,4,5,6,7,8,9,10,11,12],
    [1,2,3,4,5,6,7,8,9,10,11,12],
    [1,3,4,5,7,6,1,2,8,3,9,1],
    [8,8,1,3,3,7,1,4,6,1,3,5],
    [4,4,2,3,4,8,1,4,5,1,4,5],
    [2,2,3,7,9,9,1,4,4,3,5,4],
    [1,1,4,9,12,9,1,4,3,4,6,4],
    [3,3,5,12,3,8,1,3,3,5,4,3],
    [5,5,6,2,3,7,2,3,2,6,2,1]
];
let totalHeight = Math.ceil(Math.log(N * M) / Math.log(2)) + 1 ;
let ROOT = new Node();
// get proportions for the 2D segment tree
const _get_side_length = height => Math.pow(2.1,totalHeight - height + 1) / 50;
const _get_height = height => height;
const _get_direction = (child,parent) => {
    let direction;
    if(child === parent.leftUp) direction = "leftUp";
    else if(child === parent.leftDown) direction = "leftDown";
    else if(child === parent.rightUp) direction = "rightUp";
    else direction = "rightDown";
    return direction;
};
// 2D segment tree update function
async function update (currentNode, value, x, y, slow = false ,lx = 1, rx = M, ly = 1,ry = N,height = 0){
    const _side_length = _get_side_length(height) ;
    const _height = _get_height(height);
    // console.log(currentNode);
    if (currentNode.isEmpty === true) {
        currentNode.isEmpty = false;
        currentNode.data = value;
        let parentNodeObject = currentNode.parent === null ? scene : currentNode.parent.nodeObject;
        let newNodeObject = await createNode((value).toString(),parentNodeObject,0,0,0, lx, ly, rx, ry);
        currentNode.nodeObject = newNodeObject;

        if(currentNode.parent !== null){
            // console.log("hey there",currentNode.parent);
            // console.log(currentNode);
            let direction = _get_direction(currentNode,currentNode.parent);
            await moveNode(currentNode.nodeObject,currentNode.parent.nodeObject, _side_length , _height, direction,0.05);
            currentNode.parentPipeIndex = parentNodeObject.children.length - 1;
            // console.log(_side_length,_height);
        }
    }
    else {
        currentNode.data += value;
        if(currentNode.parent !== null) {
            let direction = _get_direction(currentNode,currentNode.parent);
            updateNode((currentNode.data).toString(), currentNode.nodeObject, currentNode.parent.nodeObject, _side_length,_height, direction,currentNode.parentPipeIndex,lx,ly,rx,ry);
            // console.log(currentNode.nodeObject);
            // return;
        }
        else{
            // let direction = "";
            updateGeometry((currentNode.data).toString(),currentNode.nodeObject,lx,ly,rx,ry);
            // updateNode((currentNode.data).toString(), currentNode.nodeObject, null, _side_length,_height, direction,0);
        }
        if(currentNode.leftUp !== null)
            updatePipe(currentNode.leftUp.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"leftUp",currentNode.leftUp.parentPipeIndex);
        if(currentNode.leftDown !== null)
            updatePipe(currentNode.leftDown.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"leftDown",currentNode.leftDown.parentPipeIndex);
        if(currentNode.rightUp !== null)
            updatePipe(currentNode.rightUp.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"rightUp",currentNode.rightUp.parentPipeIndex);
        if(currentNode.rightDown !== null)
            updatePipe(currentNode.rightDown.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"rightDown",currentNode.rightDown.parentPipeIndex);

    }

    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);

    if(lx === rx && ly === ry) {
        leafs.push(currentNode);
        return 0;
    }
    // console.log(Math.pow(2.5,totalHeight - height));
    if(x <= midX){
        if(y <= midY) {
            if(currentNode.leftUp === null) currentNode.leftUp = new Node(currentNode);
            if(slow) {
                return update.bind(this, currentNode.leftUp, value, x, y, slow, lx, midX, ly, midY, height + 1);
            }
            else {
                await update (currentNode.leftUp, value, x, y, slow, lx, midX, ly, midY, height + 1);
            }
        }
        else{
            if(currentNode.leftDown === null) currentNode.leftDown = new Node(currentNode);
            if (slow) {
                return update.bind(this, currentNode.leftDown, value, x, y, slow, lx, midX, midY + 1, ry, height + 1);
            }
            else {
                await update(currentNode.leftDown, value, x, y, slow, lx, midX, midY + 1, ry, height + 1);
            }
        }

    }
    else{
        if(y <= midY){
            if(currentNode.rightUp === null) currentNode.rightUp = new Node(currentNode);
            if(slow) {
                return update.bind(this, currentNode.rightUp, value, x, y, slow, midX + 1, rx, ly, midY, height + 1);
            }
            else {
                await update(currentNode.rightUp, value, x, y, slow, midX + 1, rx, ly, midY, height + 1);
            }
        }
        else {
            if(currentNode.rightDown === null) currentNode.rightDown = new Node(currentNode);
            if(slow) {
                return update.bind(this,currentNode.rightDown, value, x, y, slow, midX + 1, rx, midY + 1, ry, height + 1);
            }
            else{
                await update(currentNode.rightDown, value, x, y, slow, midX + 1, rx, midY + 1, ry, height + 1);
            }
        }
    }
}

function undo(currentNode, value, x, y,lx = 1, rx = M, ly = 1,ry = N, height = 0){
    const _side_length = _get_side_length(height) ;
    const _height = _get_height(height);
    // console.log(currentNode,x,y);
    if(lx === rx && ly === ry) {
        leafs.pop();
        if(currentNode.parent === null){
            scene.remove(currentNode.nodeObject);
            ROOT = new Node();
        }
        else {
            if (currentNode === currentNode.parent.leftUp)
                currentNode.parent.leftUp = null;
            else if (currentNode === currentNode.parent.leftDown)
                currentNode.parent.leftDown = null;
            else if (currentNode === currentNode.parent.rightUp)
                currentNode.parent.rightUp = null;
            else if (currentNode === currentNode.parent.rightDown)
                currentNode.parent.rightDown = null;
            currentNode.parent.nodeObject.remove(currentNode.parent.nodeObject.children[currentNode.parentPipeIndex]);
            currentNode.parent.nodeObject.remove(currentNode.nodeObject);
        }
        return;
    }
    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);
    if(x <= midX){
        if(y <= midY) {
            undo(currentNode.leftUp, value, x, y, lx, midX, ly, midY,height +1);
        }
        else{
            undo(currentNode.leftDown, value, x, y, lx, midX, midY + 1, ry,height +1);
        }
    }
    else{
        if(y <= midY){
            undo(currentNode.rightUp, value, x, y, midX + 1, rx, ly, midY,height +1);
        }
        else {
            undo(currentNode.rightDown, value, x, y, midX + 1, rx, midY + 1, ry,height +1);
        }
    }
    currentNode.data-=value;
    if(currentNode.parent !== null) {
        let direction = _get_direction(currentNode,currentNode.parent);
        updateNode((currentNode.data).toString(), currentNode.nodeObject, currentNode.parent.nodeObject, _side_length,_height, direction,currentNode.parentPipeIndex,lx,ly,rx,ry);
    }
    else {
        updateGeometry((currentNode.data).toString(),currentNode.nodeObject,lx,ly,rx,ry);
    }

    if(currentNode.leftUp !== null)
        updatePipe(currentNode.leftUp.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"leftUp",currentNode.leftUp.parentPipeIndex);
    if(currentNode.leftDown !== null)
        updatePipe(currentNode.leftDown.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"leftDown",currentNode.leftDown.parentPipeIndex);
    if(currentNode.rightUp !== null)
        updatePipe(currentNode.rightUp.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"rightUp",currentNode.rightUp.parentPipeIndex);
    if(currentNode.rightDown !== null)
        updatePipe(currentNode.rightDown.nodeObject,currentNode.nodeObject,_get_side_length(_height + 1),_get_height(_height + 1),"rightDown",currentNode.rightDown.parentPipeIndex);

    if (currentNode.leftUp === null && currentNode.leftDown === null && currentNode.rightUp === null && currentNode.rightDown === null){
        if(currentNode.parent === null){
            console.log("ehhh");
            scene.remove(currentNode.nodeObject);
            ROOT = new Node();
        }
        else {
            if (currentNode === currentNode.parent.leftUp)
                currentNode.parent.leftUp = null;
            else if (currentNode === currentNode.parent.leftDown)
                currentNode.parent.leftDown = null;
            else if (currentNode === currentNode.parent.rightUp)
                currentNode.parent.rightUp = null;
            else if (currentNode === currentNode.parent.rightDown)
                currentNode.parent.rightDown = null;
            currentNode.parent.nodeObject.remove(currentNode.parent.nodeObject.children[currentNode.parentPipeIndex]);
            currentNode.parent.nodeObject.remove(currentNode.nodeObject);
        }
    }
}
//build whole tree without animation
function build(currentNode, value, x, y,lx = 1, rx = M, ly = 1,ry = N){
    if (currentNode.isEmpty === true)
        currentNode.isEmpty = false;
    currentNode.data += value;
    if(lx === rx && ly === ry)return;
    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);
    if(x <= midX){
        if(y <= midY) {
            if (currentNode.leftUp === null) currentNode.leftUp = new Node(currentNode);
            build(currentNode.leftUp, value, x, y, lx, midX, ly, midY);
        }
        else{
            if(currentNode.leftDown === null) currentNode.leftDown = new Node(currentNode);
            build(currentNode.leftDown, value, x, y, lx, midX, midY + 1, ry);
        }
    }
    else{
        if(y <= midY){
            if(currentNode.rightUp === null) currentNode.rightUp = new Node(currentNode);
            build(currentNode.rightUp, value, x, y, midX + 1, rx, ly, midY);
        }
        else{
            if(currentNode.rightDown === null) currentNode.rightDown = new Node(currentNode);
            build(currentNode.rightDown, value, x, y, midX + 1, rx, midY + 1, ry);
        }

    }
}
// Draw tree
async function drawTree(currentNode,lx = 1, rx = M, ly = 1,ry = N,height = 0){
    const _side_length = _get_side_length(height);
    const _height = _get_height(height);
    if(currentNode.parent === null){
        currentNode.nodeObject = await createNode((currentNode.data).toString(),scene,0,0,0, lx, ly, rx, ry);
    }
    else{
        if (currentNode === currentNode.parent.leftUp)currentNode.nodeObject = await createNode((currentNode.data).toString(), currentNode.parent.nodeObject, -_side_length, -_height, -_side_length, lx, ly, rx, ry);
        else if (currentNode === currentNode.parent.leftDown)currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,-_side_length,-_height,_side_length,lx,ly,rx,ry);
        else if (currentNode === currentNode.parent.rightUp)currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,_side_length,-_height,-_side_length,lx,ly,rx,ry);
        else if (currentNode === currentNode.parent.rightDown)currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,_side_length,-_height,_side_length,lx,ly,rx,ry);
        let parentRadius = currentNode.parent.nodeObject.geometry.parameters.radius;
        let childRadius = currentNode.nodeObject.geometry.parameters.radius;

        let totalDistance =  Math.sqrt((2 * _side_length * _side_length) + (_height * _height));
        let distance = totalDistance - childRadius - parentRadius;

        let childRadiusX = _side_length - (  (_side_length * childRadius) / totalDistance );
        let childRadiusY = _height - ( (_height * childRadius) / totalDistance );
        let childRadiusZ = _side_length - (  (_side_length * childRadius) / totalDistance );

        let parentRadiusX = (_side_length * parentRadius) / (totalDistance);
        let parentRadiusY = (_height * parentRadius) / ( totalDistance );
        let parentRadiusZ = (_side_length * parentRadius) / (totalDistance);

        if (currentNode === currentNode.parent.leftUp) {
            let pipe = makePipe(currentNode.parent.nodeObject,distance,-((childRadiusX+parentRadiusX)/2),-((childRadiusY+parentRadiusY)/2),-((childRadiusZ+parentRadiusZ)/2));
            pipe.rotation.x = 0;
            pipe.rotation.y = 3 * Math.PI / 4;
            pipe.rotation.z = Math.PI/2 - Math.atan(_height / (_side_length * Math.sqrt(2)));
        }
        else if (currentNode === currentNode.parent.leftDown){
            let pipe = makePipe(currentNode.parent.nodeObject,distance,-((childRadiusX+parentRadiusX)/2),-((childRadiusY+parentRadiusY)/2),(childRadiusZ+parentRadiusZ)/2);
            pipe.rotation.x = 0;
            pipe.rotation.y = - 3 * Math.PI / 4 ;
            pipe.rotation.z = Math.PI/2 - Math.atan(_height / (_side_length * Math.sqrt(2)));
        }
        else if (currentNode === currentNode.parent.rightUp){
            let pipe = makePipe(currentNode.parent.nodeObject,distance,(childRadiusX+parentRadiusX)/2,-((childRadiusY+parentRadiusY)/2),-((childRadiusZ+parentRadiusZ)/2));
            pipe.rotation.x = 0;
            pipe.rotation.y = Math.PI / 4;
            pipe.rotation.z = Math.PI/2 - Math.atan(_height / (_side_length * Math.sqrt(2)));
        }
        else if (currentNode === currentNode.parent.rightDown){
            let pipe = makePipe(currentNode.parent.nodeObject,distance,(childRadiusX+parentRadiusX)/2,-((childRadiusY+parentRadiusY)/2),(childRadiusZ+parentRadiusZ)/2);
            pipe.rotation.x = 0;
            pipe.rotation.y = - Math.PI / 4;
            pipe.rotation.z = Math.PI/2 - Math.atan(_height / (_side_length * Math.sqrt(2)));
        }
        currentNode.parentPipeIndex = currentNode.parent.nodeObject.children.length - 1;
    }
    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);
    if(currentNode.leftUp !== null){
        await drawTree(currentNode.leftUp,lx,midX,ly,midY,height+1);
    }
    if(currentNode.leftDown !== null){
        await drawTree(currentNode.leftDown,lx,midX,midY + 1,ry,height+1);
    }
    if(currentNode.rightUp !== null){
        await drawTree(currentNode.rightUp, midX + 1, rx, ly, midY,height +1);

    }
    if(currentNode.rightDown !== null) {
        await drawTree(currentNode.rightDown, midX + 1, rx, midY + 1, ry, height + 1);
    }
}
// load font asynchronously
textLoaderPromise().then( async (font) => {
    textFont = font;
    // for(let i = 0; i < N; i++){
    //     for(let j = 0; j < M; j++){
    //         await update(ROOT, A[i][j], j + 1, i + 1);
    //         // if (j === 2) break;
    //     }
    //     // break;
    // }
});
// console.log(ROOT);
