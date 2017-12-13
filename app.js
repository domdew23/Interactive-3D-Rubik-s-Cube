var state = {
	rubiksCube: null,
	lighting: {
		diffuse: [0.2, 0.2, 0.2, 1.0],
		specular: [1.0, 1.0, 1.0, 1.0],
		shininess: 1000.0,
		ambient: [0.0, 0.0, 0.0, 1.0],
	},
	buffers : {
		cubeVertexBuffer: null,
		cubeNormalsBuffer: null,
		cubeFacesBuffer: null,
		stickerVertexBuffer: null,
		stickerNormalsBuffer: null,
		stickerFacesBuffer: null,
		innerCubeVertexBuffer: null,
		innerCubeNormalsBuffer: null,
		innerCubeFacesBuffer: null,
	},
	ui : {
		dragging: false,
		mouse : {
			lastX : -1,
			lastY: -1,
		},
		pressedKeys: {},
	},
	theta: {
		x: 0,
		y: 0,
	},
	eye: [0, 0, -15],
	center: [0, 0, 0],
	up: [0, 1, 0],
	FOV: -45,
	stickerDepth: .96,
	isRotating: false,
	EPSILON: .001,
};

var gl;
var canvas;
var program;
var viewMatrix;
var projMatrix;
var worldMatrix;
var rotationMatrix = mat4.create();;

window.onload = function main(){
	run();
}

function run(){
	canvas = document.getElementById('web_gl_canvas');
	canvas.onmousedown = mousedown;
	canvas.onmouseup = mouseup;
	canvas.onmousemove = mousemove;
	document.onkeydown = keydown;
	document.onkeyup = keyup;
	viewMatrix = mat4.create();
	projMatrix = mat4.create();
	worldMatrix = mat4.create();

	gl = init();
	linkProgram(loadVertexShader(), loadFragShader());
	gl.useProgram(program);
	state.rubiksCube = new RubiksCube();

	if (gl){
		gl.clearColor(0.5, 0.5, 0.8, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);
		gl.cullFace(gl.BACK);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		render();
	}
}

function init(){	
	try {
		var tmpgl = canvas.getContext('webgl');
	} catch (e1) {
		try {
			tmpgl = canvas.getContext('experimental-webl');
		} catch (e2){
			throw new Error('no Webgl found.');
		}
	}
	return tmpgl;
}

function loadVertexShader(){
	var vertCode = document.getElementById('vertex_shader').textContent;
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertCode);
	gl.compileShader(vertexShader);
	
	// check if everything compiled correctly
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
		throw new Error(gl.getShaderInfoLog(vertexShader));
	}
	return vertexShader;
}

function loadFragShader(){
	var fragCode = document.getElementById('fragment_shader').textContent;
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragCode);
	gl.compileShader(fragmentShader);
	
	// check if everything compiled correctly
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
		throw new Error(gl.getShaderInfoLog(fragmentShader));
	}
	return fragmentShader;
}

function linkProgram(vertexShader, fragmentShader){
	// Put vertex and fragment shaders together into complete program
	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.useProgram(program);

	program.vertexPosition = gl.getAttribLocation(program, 'vertPosition');
	gl.enableVertexAttribArray(program.vertexPosition);

	program.vertNormal = gl.getAttribLocation(program, 'vertNormal');
	gl.enableVertexAttribArray(program.vertNormal);

	program.ambient = gl.getUniformLocation(program, 'ambient');
	program.diffuse = gl.getUniformLocation(program, 'diffuse');
	program.specular = gl.getUniformLocation(program, 'specular');
	program.shininess = gl.getUniformLocation(program, 'shininess');


	// make sure program was created correctly
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		throw new Error(gl.getProgramInfoLog(program));
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
}

function createCubeBuffer() {
	state.buffers.cubeVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getCubeVerts()), gl.STATIC_DRAW);

	state.buffers.cubeNormalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeNormalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getCubeNormals()), gl.STATIC_DRAW);

	state.buffers.cubeFacesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.cubeFacesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getCubeFaces()), gl.STATIC_DRAW);
}

function createStickerBuffer(){
	state.buffers.stickerVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getStickerVerts()), gl.STATIC_DRAW);

	state.buffers.stickerNormalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerNormalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getStickerNormals()), gl.STATIC_DRAW);

	state.buffers.stickerFacesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.stickerFacesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getStickerFaces()), gl.STATIC_DRAW);
}

function createInnerCubeBuffer() {
        state.buffers.innerCubeVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.innerCubeVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getInnerCubeVertices()), gl.STATIC_DRAW);

        state.buffers.innerCubeNormalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.innerCubeNormalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getInnerCubeNormals()), gl.STATIC_DRAW);

        state.buffers.innerCubeFacesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.innerCubeFacesBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getInnerCubeFaces()), gl.STATIC_DRAW);
}

function render(){
	requestAnimationFrame(render);
	drawScene();
}

function drawScene(){
	if (state.isRotating){
		state.rubiksCube.rotateChunk();
	}

	//state.rubiksCube.drawToFrameBuffer();
	//state.rubiksCube.drawInnerCube();
	state.rubiksCube.draw();
}

function setUniforms() {
	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
}

function setLighting(color=state.lighting.ambient){
	gl.uniform4fv(program.ambient, color);
	gl.uniform4fv(program.diffuse, state.lighting.diffuse);
	gl.uniform4fv(program.specular, state.lighting.specular);
	gl.uniform1f(program.shininess, state.lighting.shininess);
}


function mousemove(event){
	if (state.ui.dragging){
		x = event.pageX; // number of pixels from left edge of the document at which mouse was clicked
		y = event.pageY;
		
		var dx = (x - state.theta.x) / 30;
		var dy = (y - state.theta.y) / 30;
		
		var axis = [dy, -dx, 0];
		var degrees = Math.sqrt(dx * dx + dy * dy);

		var newRotationMatrix = mat4.create(); // identity matrix
		mat4.rotate(newRotationMatrix, newRotationMatrix, degreesToRadians(degrees), axis);
		mat4.multiply(rotationMatrix, newRotationMatrix, rotationMatrix); // update rotation matrix
	}
}

function mousedown(event){
	state.ui.dragging = true;
	state.theta.x = event.pageX;
	state.theta.y = event.pageY;
}

function mouseup(event){
	state.ui.dragging = false;
}

function updateState(){
	var speed = 0.2;
	if (state.ui.pressedKeys[37]){
		state.app.eye.x += speed;
	} else if (state.ui.pressedKeys[39]){
		state.app.eye.x -= speed;
	} else if (state.ui.pressedKeys[40]){
		state.app.eye.y += speed;
	} else if (state.ui.pressedKeys[38]){
		state.app.eye.y -= speed;
	}
}

function scrambleCube(){
	state.rubiksCube.cycles = Math.floor(Math.random() * 100);
	state.rubiksCube.scramble();
}

function keydown(event){
	state.ui.pressedKeys[event.keyCode] = true;
}

function keyup(event){
	state.ui.pressedKeys[event.keyCode] = false;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}