var state = {
	rubiksCube: null,
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
	animation: {},
	theta: {
		x: 0,
		y: 0,
	},
	eye: [0, 0, -15],
	center: [0, 0, 0],
	up: [0, 1, 0],
	objects: [],
	FOV: -45,
	stickerDepth: .96,
};

var gl;
var canvas;
var program;
var viewMatrix;
var projMatrix;
var worldMatrix;
var rotationMatrix;

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
	rotationMatrix = mat4.create();

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
		tick();
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

	// make sure program was created correctly
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
		throw new Error(gl.getProgramInfoLog(program));
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
}

function createBuffer(vertices, indices, program){
	gl.useProgram(program);
	var vertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	var itemSize = 3;
	var numItems = vertices.length/itemSize;

	var indexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	var colorAttribLocation = gl.getAttribLocation(program, 'vertColor')
	gl.vertexAttribPointer(
		positionAttribLocation,
		itemSize,
		gl.FLOAT,
		gl.FALSE,
		6 * Float32Array.BYTES_PER_ELEMENT,
		0
	);
	
	gl.vertexAttribPointer(
		colorAttribLocation,
		3,
		gl.FLOAT,
		gl.FALSE,
		6 * Float32Array.BYTES_PER_ELEMENT,
		3 * Float32Array.BYTES_PER_ELEMENT
	);
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.useProgram(program);

	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);

	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [state.app.eye.x, state.app.eye.y, state.app.eye.z], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	var theta = 0;
	var yRoatation = new Float32Array(16);
	var xRoatation = new Float32Array(16);
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);
	
	var loop = function() {
		updateState();
		mat4.rotate(yRoatation, identityMatrix, state.theta.y/1000, [0, 1, 0]);
		mat4.rotate(xRoatation, identityMatrix, state.theta.x/1000, [1, 0, 0]);
		mat4.mul(worldMatrix, xRoatation, yRoatation);
		
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
		
		gl.clearColor(0.75, 0.85, 0.8, 1.0);;
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
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

function tick(){
	requestAnimationFrame(tick);
	drawScene();
}

function drawScene(){
	state.rubiksCube.drawToFrameBuffer();
	//state.rubiksCube.drawInnerCube();
	state.rubiksCube.draw();

	var yRoatation = new Float32Array(16);
	var xRoatation = new Float32Array(16);
	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

	mat4.rotate(yRoatation, identityMatrix, state.theta.y/1000, [0, 1, 0]);
	mat4.rotate(xRoatation, identityMatrix, state.theta.x/1000, [1, 0, 0]);
	mat4.mul(worldMatrix, xRoatation, yRoatation);
}

function setMatrixUniforms() {
	var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
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

function keydown(event){
	state.ui.pressedKeys[event.keyCode] = true;
}

function keyup(event){
	state.ui.pressedKeys[event.keyCode] = false;
}

function mousedown(event){
	var x = event.clientX;
	var y = event.clientY;
	var rect = event.target.getBoundingClientRect();

	if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
		state.ui.mouse.lastX = x;
		state.ui.mouse.lastY = y;
		state.ui.dragging = true;
	}
}

function mouseup(event){
	state.ui.dragging = false;
}

function mousemove(event){
	var x = event.clientX;
	var y = event.clientY;
	if (state.ui.dragging){
		var factor = 20;
		var dx = factor * (x - state.ui.mouse.lastX);
		var dy = factor * (y - state.ui.mouse.lastY);

		state.theta.x += dy;
		state.theta.y += dx;
	}
	state.ui.mouse.lastX = x;
	state.ui.mouse.lastY = y;
}

function getAmbient(){
	return [1.0, 1.0, 1.0, 1.0];
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}