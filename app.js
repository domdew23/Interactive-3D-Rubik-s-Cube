var state = {
	rubiksCube: null,
	lighting: {
		diffuse: [0.2, 0.2, 0.2, 1.0],
		specular: [1.0, 1.0, 1.0, 1.0],
		shininess: 100.0,
		ambient: [0.0, 0.0, 0.0, 1.0],
	},
	buffers : {
		cubeVertexBuffer: null,
		cubeNormalsBuffer: null,
		cubeIndicesBuffer: null,
		stickerVertexBuffer: null,
		stickerNormalsBuffer: null,
		stickerIndicesBuffer: null,
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
	eye: [0, 0, -18],
	center: [0, 0, 0],
	up: [0, 1, 0],
	FOV: -45,
	stickerDepth: .96,
	isRotating: false,
	constantRotate: false,
	EPSILON: .001,
};

var gl;
var canvas;
var program;
var viewMatrix;
var projMatrix;
var worldMatrix;
var rotationMatrix = mat4.create();
var newTime = 0;
var oldTime = 0;
var theta = 0;

window.onload = function main(){
	run();
}

function run(){
	canvas = document.getElementById('web_gl_canvas');
	canvas.onmousedown = mousedown;
	canvas.onmouseup = mouseup;
	canvas.onmousemove = mousemove;
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
	/* create space on GPU for each cube's vertices, normals, indices */

	state.buffers.cubeVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getCubeVerts()), gl.STATIC_DRAW);

	state.buffers.cubeNormalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeNormalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getCubeNormals()), gl.STATIC_DRAW);

	state.buffers.cubeIndicesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.cubeIndicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getCubeIndices()), gl.STATIC_DRAW);
}

function createStickerBuffer(){
	/* create space on GPU for sticker vertices, normals, indices */
	
	state.buffers.stickerVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerVertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getStickerVerts()), gl.STATIC_DRAW);

	state.buffers.stickerNormalsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerNormalsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getStickerNormals()), gl.STATIC_DRAW);

	state.buffers.stickerIndicesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.stickerIndicesBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(getStickerIndices()), gl.STATIC_DRAW);
}

function render(){
	requestAnimationFrame(render);
	update();
}

function update(){
	if (state.isRotating){
		state.rubiksCube.rotateChunk();
	}
	
	if (state.constantRotate){
		myRotate();
	}
	state.rubiksCube.draw();
}

function myRotate(){
		oldTime = newTime;
		newTime = performance.now();
		delta = newTime - oldTime;
	if (state.constantRotate){
		theta = (delta / 1000 / 6 * 2 * Math.PI);
	}

	var newRotationMatrix = mat4.create(); // identity matrix
	mat4.rotate(newRotationMatrix, newRotationMatrix, theta, [0, -1, 0]);
	mat4.multiply(rotationMatrix, newRotationMatrix, rotationMatrix); // update rotation matrix	
}

function setUniforms() {
	/* send uniforms to shaders */
	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
}

function setLighting(color=state.lighting.ambient){
	/* send lighting information to shaders */
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

function scrambleCube(){
	if (!state.isRotating){
		state.rubiksCube.cycles = Math.floor(Math.random() * 100);
		state.rubiksCube.scramble();
	}
}

function randomMove(){
	if (!state.isRotating){
		state.rubiksCube.cycles = 1;
		state.rubiksCube.scramble();
	}
}

function changeRotation(){
	if (state.constantRotate){
		state.constantRotate = false;
	} else {
		state.constantRotate = true;
	}
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}