const {OrbitControls,Interaction} = THREE;

// initial setup
// console.log(Interaction);
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
// set Interaction Manager
const interactionManager = new THREE.InteractionManager(renderer, scene, camera);
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
    const material = new THREE.MeshPhongMaterial({color: color, opacity: 0.2, transparent: true, side: THREE.BackSide});
    const sphere = new THREE.Mesh(geometry, material);

    parent.add(sphere);

    sphere.position.x = positionX;
    sphere.position.y = positionY;
    sphere.position.z = positionZ;

    return sphere;
}
//declare function that creates transparent layer for sphere
function makeTransparentSphereLayer(positionX,positionY,positionZ,radius,widthSegments = 32, heightSegments = 32){
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshPhongMaterial({color:'red',opacity: 0.0, transparent: true, side: THREE.FrontSide});
    const sphereTransparentLayer = new THREE.Mesh(geometry, material);

    scene.add(sphereTransparentLayer);

    sphereTransparentLayer.position.x = positionX;
    sphereTransparentLayer.position.y = positionY;
    sphereTransparentLayer.position.z = positionZ;

    return sphereTransparentLayer;
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
        let rangeText = "("+(ly).toString() + "," + (lx).toString()+")";
        await makeText(rangeText,node, color,0.3,-0.12 * rangeFontSize/textFontSize * rangeText.length,-node.geometry.parameters.radius - 0.5);
    }
    else{
        let rangeText = "[("+(ly).toString()+","+(lx).toString()+")-("+(ry).toString()+","+(rx).toString()+")]";
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
async function blinkNode(node,duration,startTime = new Date().getTime()){
    // console.log(node);
    if (node.material.color.getHex() === 0x157d6c ){

        node.material.color.setHSL(0,1,0.5);
        node.material.opacity = 0.7;
    }
    else {
        let {h,s,l} = node.material.color.getHSL();
        node.material.color.setHSL(h,s,Math.max((l+0.01)%1,0.3));
        node.material.opacity = 0.5;
    }
    let currentTime = new Date().getTime();
    if(currentTime - startTime < duration)
        requestAnimationFrame(blinkNode.bind(this,node,duration,startTime));
    else{
        node.material.color.setHex(0x157d6c);
        node.material.opacity = 0.2;
    }
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
const buildActionsButton = document.getElementById("buildActionsButton");
buildActionsButton.disabled=true;
const queryActionsButton = document.getElementById("queryActionsButton");
queryActionsButton.disabled=true;
const addSlowBtn = document.getElementById("add-slow");
const addFastBtn = document.getElementById("add-fast");
const addAllBtn = document.getElementById("add-all");
const backBtn = document.getElementById("back");
const buildBtn = document.getElementById("build");
const answerBtn = document.getElementById("answer");
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
        // console.log(ROOT.nodeObject);
    }
});
addAllBtn.addEventListener("click",async () => {
    for(; i < N; i++){
        for(; j < M; j++){
            await update(ROOT, A[i][j], j + 1, i + 1);
        }
        j=0;
    }
});
backBtn.addEventListener("click",async() =>{
    // console.log(leafs);
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
    // console.log(ROOT);
    if(ROOT.isEmpty===false){
        while(scene.children.length)scene.remove(scene.children[0]);
        addLight(-1, 2, 4);
        addLight(1, -1, -2);
        ROOT = new Node();
        i=0;
        j=0;
    }
    for(let i = 0; i < N; i++){
        for(let j = 0; j < M; j++){
            // console.log(A[i][j]);
            build(ROOT, A[i][j], j + 1, i + 1);
        }
    }
    await drawTree(ROOT);

});

let cleanUpTree;
answerBtn.addEventListener('click', async () => {
    // console.log(cleanUpTree);
    if(cleanUpTree !== undefined){
        cleanUpTree();
    }
    let startX = parseInt(document.getElementById('fieldFromJ').value);
    let startY = parseInt(document.getElementById('fieldFromI').value);
    let endX = parseInt(document.getElementById('fieldToJ').value);
    let endY = parseInt(document.getElementById('fieldToI').value);
    //2,5,3,6
    // console.log(ROOT,startX,startY,endX,endY);
    document.getElementById('result').value = (answer(ROOT,startX,endX,startY,endY)).toString();
    cleanUpTree = clearAnswer.bind(this,ROOT,startX,endX,startY,endY);
});

// algorithm implementation
// node class
class Node{
    constructor(parent = null,
                isEmpty = true,
                data = 0,
                leftUp = null,
                leftDown = null,
                rightUp = null,
                rightDown = null,
                nodeObject = null,
                layer = null,
                parentPipeIndex = 0,
                globalPositionX = 0,
                globalPositionY = 0,
                globalPositionZ = 0) {
        this.isEmpty = isEmpty;
        this.parent = parent;
        this.data = data;
        this.leftUp = leftUp;
        this.leftDown = leftDown;
        this.rightUp = rightUp;
        this.rightDown = rightDown;
        this.nodeObject = nodeObject;
        this.parentPipeIndex = parentPipeIndex;
        this.globalPositionX = globalPositionX;
        this.globalPositionY = globalPositionY;
        this.globalPositionZ = globalPositionZ;
        this.layer = layer;
    }
}
let inputContent ;
document.getElementById('fileUploadInput').addEventListener('change', (event) => {
        const input = event.target
        if ('files' in input && input.files.length > 0) {
            placeFileContent(
                inputContent,
                input.files[0])
        }
});
function placeFileContent(target, file) {
    readFileContent(file).then(content => {
        content = JSON.parse(JSON.stringify(content).split('\\r\\n').join(' '));
        const input = content.split(' ');
        // console.log(input);
        N = parseInt(input[0]);
        M = parseInt(input[1]);
        // console.log(N,M);
        let index = 2;
        for(let i = 0; i < N; i++){
            let arr = []
            for(let j=0; j < M; j++){
                arr.push(parseInt(input[index]));
                index++;
            }
            // console.log(arr);
            A.push(arr);
        }
        // console.log(A);
        visualiseArray(N,M);
        buildActionsButton.disabled=false;
        queryActionsButton.disabled=false;
        totalHeight = Math.ceil(Math.log(N * M) / Math.log(2)) + 1 ;
        maxLength = 0;
        for(let i = 0; i < N; i++){
            for(let j = 0; j < M; j++){
                build(SKETCH, A[i][j], j + 1, i + 1);
                maxLength = Math.max(maxLength,(A[i][j]).toString().length);
            }
        }
    }).catch(error => console.log(error))
}
// constants and variables
let N;
let M;
let A = [];
// let N = 9;
// let M = 12;
// let A = [
//     [1,2,3,4,5,6,7,8,9,10,11,12],
//     [1,2,3,4,5,6,7,8,9,10,11,12],
//     [1,3,4,5,7,6,1,2,8,3,9,1],
//     [8,8,1,3,3,7,1,4,6,1,3,5],
//     [4,4,2,3,4,8,1,4,5,1,4,5],
//     [2,2,3,7,9,9,1,4,4,3,5,4],
//     [1,1,4,9,12,9,1,4,3,4,6,4],
//     [3,3,5,12,3,8,1,3,3,5,4,3],
//     [5,5,6,2,3,7,2,3,2,6,2,1]
// ];
//2 - 2.1
//3 - 2.25
//4 - 2.4
//5 - 2.5
//6 - 2.6
//7 - 2.7
//8 - 2.8
//9 - 2.9
//10 - 3
let totalHeight;
let ROOT = new Node();
let SKETCH = new Node();
let maxLength;

const pipeModes = ['Proportional','Relative','Average'];
const nodeModes = ['Flexible','Fixed'];
const Mode = {
    pipe : pipeModes[0],
    node : nodeModes[0]
}
const pipeRadios =  document.pipeMode.pipeRadio;
let prev = null;
for (let i = 0; i < pipeRadios.length; i++) {
    pipeRadios[i].addEventListener('change', function() {
        if (this !== prev) {
            prev = this;
            Mode.pipe = pipeModes[i];
            if(ROOT.isEmpty===false){
                scene.remove(ROOT.nodeObject);
                while(scene.children.length !== 0){
                    scene.remove(scene.children[0]);
                }
                addLight(-1, 2, 4);
                addLight(1, -1, -2);
                ROOT = new Node();
                i=0;
                j=0;
            }
        }
    });
    if(pipeRadios[i].checked){
        Mode.pipe = pipeModes[i];
    }
}

// get proportions for the 2D segment tree
const _calculate_side_length = (numberLength,height) => {
    let number;
    if(numberLength <= 2) number = 2.1;
    else if(numberLength === 3) number = 2.25;
    else number = 2 + (numberLength/10);
    return Math.pow(number,totalHeight - height + 1) / 50;
}
const _get_side_length = (node,height) => {
    if (Mode.pipe === 'Proportional'){
        return _calculate_side_length(maxLength,height);
    }
    else if (Mode.pipe === 'Relative'){
        return _calculate_side_length((node.data).toString().length,height);
    }
    else if(Mode.pipe === 'Average') {
        return node.parent === null ? 0 : optimizeAverageSideLength(node.parent, height);
    }
}
const _calculate_height = (numberLength,height) => height + numberLength/5;
const _get_height = (node,height) => {
    if (Mode.pipe === 'Proportional'){
        return height;
    }
    else if (Mode.pipe === 'Relative'){
        return height;
    }
    else if(Mode.pipe === 'Average') {
        return node.parent === null ? 0 : optimizeAverageHeight(node.parent, height);
    }
}
const _get_direction = (child,parent) => {
    let direction;
    if(child === parent.leftUp) direction = "leftUp";
    else if(child === parent.leftDown) direction = "leftDown";
    else if(child === parent.rightUp) direction = "rightUp";
    else direction = "rightDown";
    return direction;
};
function optimizeAverageSideLength(node,height){
    let sum = 0;
    let quantity = 0;
    if(node.leftUp !== null){
        sum+=_calculate_side_length((node.leftUp.data).toString().length,height);
        quantity++;
    }
    if(node.leftDown !== null){
        sum+=_calculate_side_length((node.leftDown.data).toString().length,height);
        quantity++;
    }
    if(node.rightUp !== null){
        sum+=_calculate_side_length((node.rightUp.data).toString().length,height);
        quantity++;
    }
    if(node.rightDown !== null){
        sum+=_calculate_side_length((node.rightDown.data).toString().length,height);
        quantity++;
    }
    return quantity === 0 ? 0 : sum / quantity;
}
function optimizeAverageHeight(node,height){
    let sum = 0;
    let quantity = 0;
    if(node.leftUp !== null){
        sum+=_calculate_height((node.leftUp.data).toString().length,height);
        quantity++;
    }
    if(node.leftDown !== null){
        sum+=_calculate_height((node.leftDown.data).toString().length,height);
        quantity++;
    }
    if(node.rightUp !== null){
        sum+=_calculate_height((node.rightUp.data).toString().length,height);
        quantity++;
    }
    if(node.rightDown !== null){
        sum+=_calculate_height((node.rightDown.data).toString().length,height);
        quantity++;
    }
    return quantity === 0 ? 0 : sum / quantity;
}
// 2D segment tree update function
async function update (currentNode, value, x, y, slow = false ,lx = 1, rx = M, ly = 1,ry = N,height = 0,sketchNode = SKETCH){
    // console.log(currentNode);
    if (currentNode.isEmpty === true) {
        currentNode.isEmpty = false;
        currentNode.data = value;
        const _side_length = _get_side_length(sketchNode,height) ;
        const _height = _get_height(sketchNode,height);
        // console.log(_side_length,_height);

        let parentNodeObject = currentNode.parent === null ? scene : currentNode.parent.nodeObject;
        let newNodeObject = await createNode((value).toString(),parentNodeObject,0,0,0, lx, ly, rx, ry);
        currentNode.nodeObject = newNodeObject;
        if(currentNode.parent === null) {
            currentNode.globalPositionX = scene.position.x;
            currentNode.globalPositionY = scene.position.y;
            currentNode.globalPositionZ = scene.position.z;
        }
        else{
            currentNode.globalPositionX = currentNode.parent.globalPositionX;
            currentNode.globalPositionY = currentNode.parent.globalPositionY;
            currentNode.globalPositionZ = currentNode.parent.globalPositionZ;
            const DirMap = new Map([
                ["leftUp",[-1,-1,-1]],
                ["leftDown",[-1,-1,1]],
                ["rightUp",[1,-1,-1]],
                ["rightDown",[1,-1,1]]
            ]);
            let direction = _get_direction(currentNode,currentNode.parent);
            let DirValues = DirMap.get(direction);
            currentNode.globalPositionX += _side_length * DirValues[0];
            currentNode.globalPositionY += _height * DirValues[1];
            currentNode.globalPositionZ += _side_length * DirValues[2];
            await moveNode(currentNode.nodeObject,currentNode.parent.nodeObject, _side_length , _height, direction,0.05);
            currentNode.parentPipeIndex = parentNodeObject.children.length - 1;
            // console.log(_side_length,_height);
        }
    }
    else {
        currentNode.data += value;
        const _side_length = _get_side_length(sketchNode,height) ;
        const _height = _get_height(sketchNode,height);
        // console.log(_side_length,_height);
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
            updatePipe(currentNode.leftUp.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.leftUp,height + 1),_get_height(sketchNode.leftUp,height + 1),"leftUp",currentNode.leftUp.parentPipeIndex);
        if(currentNode.leftDown !== null)
            updatePipe(currentNode.leftDown.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.leftDown,height + 1),_get_height(sketchNode.leftDown,height + 1),"leftDown",currentNode.leftDown.parentPipeIndex);
        if(currentNode.rightUp !== null)
            updatePipe(currentNode.rightUp.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.rightUp,height + 1),_get_height(sketchNode.rightUp,height + 1),"rightUp",currentNode.rightUp.parentPipeIndex);
        if(currentNode.rightDown !== null)
            updatePipe(currentNode.rightDown.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.rightDown,height + 1),_get_height(sketchNode.rightDown,height + 1),"rightDown",currentNode.rightDown.parentPipeIndex);

    }

    currentNode.layer = makeTransparentSphereLayer(currentNode.globalPositionX,currentNode.globalPositionY,currentNode.globalPositionZ,currentNode.nodeObject.geometry.parameters.radius);
    // console.log("here is layer: ",currentNode.layer);
    // console.log("here is node:", currentNode.nodeObject);
    currentNode.layer.cursor = "pointer";
    currentNode.layer.on('click',() => {
        // console.log('clicked');
        controls.target.set(currentNode.globalPositionX,currentNode.globalPositionY,currentNode.globalPositionZ);
        controls.update();
    });

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
                await blinkNode(currentNode.nodeObject,3000);
                return update.bind(this, currentNode.leftUp, value, x, y, slow, lx, midX, ly, midY, height + 1,sketchNode.leftUp);
            }
            else {
                await update (currentNode.leftUp, value, x, y, slow, lx, midX, ly, midY, height + 1,sketchNode.leftUp);
            }
        }
        else{
            if(currentNode.leftDown === null) currentNode.leftDown = new Node(currentNode);
            if (slow) {
                await blinkNode(currentNode.nodeObject,3000);
                return update.bind(this, currentNode.leftDown, value, x, y, slow, lx, midX, midY + 1, ry, height + 1,sketchNode.leftDown);
            }
            else {
                await update(currentNode.leftDown, value, x, y, slow, lx, midX, midY + 1, ry, height + 1,sketchNode.leftDown);
            }
        }

    }
    else{
        if(y <= midY){
            if(currentNode.rightUp === null) currentNode.rightUp = new Node(currentNode);
            if(slow) {
                await blinkNode(currentNode.nodeObject,3000);
                return update.bind(this, currentNode.rightUp, value, x, y, slow, midX + 1, rx, ly, midY, height + 1,sketchNode.rightUp);
            }
            else {
                await update(currentNode.rightUp, value, x, y, slow, midX + 1, rx, ly, midY, height + 1,sketchNode.rightUp);
            }
        }
        else {
            if(currentNode.rightDown === null) currentNode.rightDown = new Node(currentNode);
            if(slow) {
                await blinkNode(currentNode.nodeObject,3000);
                return update.bind(this,currentNode.rightDown, value, x, y, slow, midX + 1, rx, midY + 1, ry, height + 1,sketchNode.rightDown);
            }
            else{
                await update(currentNode.rightDown, value, x, y, slow, midX + 1, rx, midY + 1, ry, height + 1,sketchNode.rightDown);
            }
        }
    }

}

//one step back function
function undo(currentNode, value, x, y,lx = 1, rx = M, ly = 1,ry = N, height = 0, sketchNode = SKETCH){
    const _side_length = _get_side_length(sketchNode,height) ;
    const _height = _get_height(sketchNode,height);
    // console.log(currentNode,x,y);
    if(lx === rx && ly === ry) {
        leafs.pop();
        scene.remove(currentNode.layer);
        currentNode.layer = null;
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
            undo(currentNode.leftUp, value, x, y, lx, midX, ly, midY,height +1,sketchNode.leftUp);
        }
        else{
            undo(currentNode.leftDown, value, x, y, lx, midX, midY + 1, ry,height +1,sketchNode.leftDown);
        }
    }
    else{
        if(y <= midY){
            undo(currentNode.rightUp, value, x, y, midX + 1, rx, ly, midY,height +1,sketchNode.rightUp);
        }
        else {
            undo(currentNode.rightDown, value, x, y, midX + 1, rx, midY + 1, ry,height +1,sketchNode.rightDown);
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
        updatePipe(currentNode.leftUp.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.leftUp,height + 1),_get_height(sketchNode.leftUp,height + 1),"leftUp",currentNode.leftUp.parentPipeIndex);
    if(currentNode.leftDown !== null)
        updatePipe(currentNode.leftDown.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.leftDown,height + 1),_get_height(sketchNode.leftDown,height + 1),"leftDown",currentNode.leftDown.parentPipeIndex);
    if(currentNode.rightUp !== null)
        updatePipe(currentNode.rightUp.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.rightUp,height + 1),_get_height(sketchNode.rightUp,height + 1),"rightUp",currentNode.rightUp.parentPipeIndex);
    if(currentNode.rightDown !== null)
        updatePipe(currentNode.rightDown.nodeObject,currentNode.nodeObject,_get_side_length(sketchNode.rightDown,height + 1),_get_height(sketchNode.rightDown,height + 1),"rightDown",currentNode.rightDown.parentPipeIndex);


    if (currentNode.leftUp === null && currentNode.leftDown === null && currentNode.rightUp === null && currentNode.rightDown === null){
        scene.remove(currentNode.layer);
        currentNode.layer = null;
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
    const _side_length = _get_side_length(currentNode,height);
    const _height = _get_height(currentNode,height);
    if(currentNode.parent === null){
        currentNode.nodeObject = await createNode((currentNode.data).toString(),scene,0,0,0, lx, ly, rx, ry);
        currentNode.globalPositionX = scene.position.x;
        currentNode.globalPositionY = scene.position.y;
        currentNode.globalPositionZ = scene.position.z;
    }
    else{
        currentNode.globalPositionX = currentNode.parent.globalPositionX;
        currentNode.globalPositionY = currentNode.parent.globalPositionY;
        currentNode.globalPositionZ = currentNode.parent.globalPositionZ;
        if (currentNode === currentNode.parent.leftUp){
            currentNode.nodeObject = await createNode((currentNode.data).toString(), currentNode.parent.nodeObject, -_side_length, -_height, -_side_length, lx, ly, rx, ry);
            currentNode.globalPositionX += -_side_length;
            currentNode.globalPositionY += -_height;
            currentNode.globalPositionZ += -_side_length;
        }
        else if (currentNode === currentNode.parent.leftDown){
            currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,-_side_length,-_height,_side_length,lx,ly,rx,ry);
            currentNode.globalPositionX += -_side_length;
            currentNode.globalPositionY += -_height;
            currentNode.globalPositionZ += _side_length;
        }
        else if (currentNode === currentNode.parent.rightUp){
            currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,_side_length,-_height,-_side_length,lx,ly,rx,ry);
            currentNode.globalPositionX += _side_length;
            currentNode.globalPositionY += -_height;
            currentNode.globalPositionZ += -_side_length;
        }
        else if (currentNode === currentNode.parent.rightDown){
            currentNode.nodeObject = await createNode((currentNode.data).toString(),currentNode.parent.nodeObject,_side_length,-_height,_side_length,lx,ly,rx,ry);
            currentNode.globalPositionX += _side_length;
            currentNode.globalPositionY += -_height;
            currentNode.globalPositionZ += _side_length;
        }
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

    currentNode.layer = makeTransparentSphereLayer(currentNode.globalPositionX,currentNode.globalPositionY,currentNode.globalPositionZ,currentNode.nodeObject.geometry.parameters.radius);
    currentNode.layer.cursor = "pointer";
    currentNode.layer.on("click", () => {
        controls.target.set(currentNode.globalPositionX,currentNode.globalPositionY,currentNode.globalPositionZ);
        controls.update();
    });

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
});
// console.log(ROOT);

animate();

function answer(currentNode, startX, endX, startY, endY, lx = 1, rx = M, ly = 1, ry = N) {
    if (currentNode === null) return 0;
    if ((rx < startX || endX < lx) || (ry < startY || endY < ly)) return 0;
    if ((startX <= lx && rx <= endX) && (startY <= ly && ry <= endY)) {
        currentNode.nodeObject.material.color.setHSL(0,1,0.5);
        currentNode.nodeObject.material.opacity = 0.7;
        return currentNode.data;
    }

    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);

    let leftUpNode = answer(currentNode.leftUp, startX, endX, startY, endY, lx, midX, ly, midY);
    let leftDownNode = answer(currentNode.leftDown, startX, endX, startY, endY, lx, midX, midY + 1, ry);
    let rightUpNode = answer(currentNode.rightUp, startX, endX, startY, endY, midX + 1, rx, ly, midY) ;
    let rightDownNode = answer(currentNode.rightDown, startX, endX, startY, endY, midX + 1, rx, midY + 1, ry);

    return leftUpNode + leftDownNode + rightUpNode + rightDownNode;
}

function clearAnswer(currentNode, startX, endX, startY, endY, lx = 1, rx = M, ly = 1, ry = N) {
    if (currentNode === null) return;
    if ((rx < startX || endX < lx) || (ry < startY || endY < ly)) return;
    if ((startX <= lx && rx <= endX) && (startY <= ly && ry <= endY)) {
        currentNode.nodeObject.material.color.setHex(0x157d6c);
        currentNode.nodeObject.material.opacity = 0.2;
        return;
    }

    const midX = Math.floor((lx + rx) / 2);
    const midY = Math.floor((ly + ry) / 2);

    clearAnswer(currentNode.leftUp, startX, endX, startY, endY, lx, midX, ly, midY);
    clearAnswer(currentNode.leftDown, startX, endX, startY, endY, lx, midX, midY + 1, ry);
    clearAnswer(currentNode.rightUp, startX, endX, startY, endY, midX + 1, rx, ly, midY) ;
    clearAnswer(currentNode.rightDown, startX, endX, startY, endY, midX + 1, rx, midY + 1, ry);
}