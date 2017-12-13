function RubiksCube() {
	this.cubes = new Array(3);
    this.pickingFramebuffer = null;
    this.innerCube = new InnerCube();
    this.chunkToRotate = null;
    this.rotationAxis = null;
    this.rotationAngle = 0;
    this.axis = 0;
    this.cycles = 0;

	this.init = function(){
		createCubeBuffer();
		createStickerBuffer();
		for (x = 0; x < 3; x++){
			this.cubes[x] = new Array(3);
			for (y = 0; y < 3; y++){
				this.cubes[x][y] = new Array(3) ;
				for (z = 0; z < 3; z++){
					var coordinates = [x - 1, y - 1, z - 1];
					var color = [x / 3, y / 3, z / 3, 1.0];
					this.cubes[x][y][z] = new Cube(this, coordinates, color);
				}
			}
		}
	}

	this.draw = function(){
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		mat4.perspective(projMatrix, state.FOV, canvas.width / canvas.height, 0.1, 100.0);
		mat4.identity(viewMatrix);
		mat4.lookAt(viewMatrix, state.eye, state.center, state.up);
		mat4.multiply(viewMatrix, viewMatrix, rotationMatrix);

		for (x = 0; x < 3; x++){
			for (y = 0; y < 3; y++){
				for (z = 0; z < 3; z++){
					var cube = this.cubes[x][y][z];
					cube.draw(state.lighting.ambient);
					for (s in cube.stickers){
						cube.stickers[s].draw();
					}
				}
			}
		}
	}

	this.drawToFrameBuffer = function() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingFramebuffer);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(projMatrix, state.FOV, canvas.width / canvas.height, 0.1, 100.0);
        mat4.identity(viewMatrix);
        mat4.lookAt(viewMatrix, state.eye, state.center, state.up);
        mat4.multiply(viewMatrix, viewMatrix, rotationMatrix);

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                for (z = 0; z < 3; z++) {
                    var cube = this.cubes[x][y][z];
                    cube.draw(cube.color);
                }
            }
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	this.drawInnerCube = function() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.innerCube.normalsFramebuffer);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(projMatrix, state.FOV, canvas.width / canvas.height, 0.1, 100.0);
        mat4.identity(viewMatrix);
        mat4.lookAt(viewMatrix, state.eye, state.center, state.up);
        mat4.multiply(viewMatrix, viewMatrix, rotationMatrix);
        
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, viewMatrix);
       	this.innerCube.draw();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    this.scramble = function() {
		if (this.cycles == 0){
			state.isRotating = false;
			return;
		}

		x = Math.floor(Math.random() * 3);
		y = Math.floor(Math.random() * 3);
		z = Math.floor(Math.random() * 3);
		this.axisToRotate = Math.floor(Math.random() * 3);
		this.cubeToRotate = state.rubiksCube.cubes[x][y][z];

		switch (this.axisToRotate){
			case 0: this.rotationAxis = [1, 0, 0]; break;
			case 1: this.rotationAxis = [0, 1, 0]; break;
			case 2: this.rotationAxis = [0, 0, 1]; break
			default: break;
		}

	  if (Math.random() < 0.5) {
	  		// 50% chance you rotate opposite way
            vec3.scale(this.rotationAxis, this.rotationAxis, -1);
        }

		this.setChunk();
		state.isRotating = true;
		this.cycles -= 1;
	}

	this.setChunk = function(){
		if (!this.rotationAxis){
			return;
		}

		var selectedChunk = this.cubeToRotate.coordinates[this.axisToRotate];

        var chunk = [];
        for (var x = 0; x < 3; x++) {
            for (var y = 0; y < 3; y++) {
                for (var z = 0; z < 3; z++) {
                    var cube = this.cubes[x][y][z];
                    if (Math.abs(cube.coordinates[this.axisToRotate] - selectedChunk) < state.EPSILON) {
                    	// find cube that matches coordinates and add to chunk
                        chunk.push(cube);
                    }
                }
            }
        }
        if (chunk.length == 9) {
            this.chunkToRotate = chunk;
        }
	}

	this.rotateChunk = function() {
		if (Math.abs(this.rotationAngle) == 90) {
            this.rotationAngle = 0;
            isRotating = false;
            this.scramble();
            return;
        }

        this.rotationAngle += 5;

		var newRotationMatrix = mat4.create();
		mat4.rotate(newRotationMatrix, newRotationMatrix, degreesToRadians(5), this.rotationAxis);

		for (i = 0; i < this.chunkToRotate.length; i++){
			var cube = this.chunkToRotate[i];
			vec3.transformMat4(cube.coordinates, cube.coordinates, newRotationMatrix);
			mat4.multiply(cube.rotationMatrix, newRotationMatrix, cube.rotationMatrix);
		}
	}

	this.colorToCube = function(rgba){
		var r = rbga[0];
		var g = rgba[1];
		var b = rgba[2];
		if (r == 255 && g == 255 && b == 255){
			return null;
		} else {
			return this.cubes[r % 3][g % 3][b % 3];
		}
	}

	this.init();
}

