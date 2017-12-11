function RubiksCube() {
	this.cubes = new Array(3);
    this.pickingFramebuffer = null;
    this.innerCube = new InnerCube();

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
		mat4.lookAt(viewMatrix, state.eye, state.center, state.up);
		mat4.multiply(viewMatrix, viewMatrix, rotationMatrix);

		for (x = 0; x < 3; x++){
			for (y = 0; y < 3; y++){
				for (z = 0; z < 3; z++){
					var cube = this.cubes[x][y][z];
					cube.draw(getAmbient());
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

