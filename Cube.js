function Cube(rubiksCube, coordinates, color){
    this.rubiksCube = rubiksCube;
    this.coordinates = coordinates;
    this.color = color;
    this.rotationMatrix = mat4.create();
    this.translationVector = vec3.create();
    this.stickers = [];

    this.COLORS = {
        'blue': [0.0, 0.0, 1.0, 1.0],
        'green': [0.0, 1.0, 0.0, 1.0],
        'orange': [1.0, 0.5, 0.0, 1.0],
        'red': [1.0, 0.0, 0.0, 1.0],
        'white': [1.0, 1.0, 1.0, 1.0],
        'yellow': [1.0, 1.0, 0.0, 1.0]
    }

    this.rotate = function(){
    	mat4.multiply(viewMatrix, viewMatrix, this.rotationMatrix);
    	mat4.translate(viewMatrix, viewMatrix, this.translationVector);
    }

    this.init = function(){
    	vec3.scale(this.translationVector, this.coordinates, 2);
    	this.initStickers();
    }

    this.initStickers = function(){
    	/* find cube each sticker is associated with and color */
    	
    	var x = this.coordinates[0];
    	var y = this.coordinates[1];
    	var z = this.coordinates[2];
    	
    	if (x == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['red'], function() {
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [-state.stickerDepth, 0, 0]);
    			mat4.rotateZ(viewMatrix, viewMatrix, degreesToRadians(90));
    		}));
    	} else if (x == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['orange'], function(){
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [state.stickerDepth, 0, 0]);
    			mat4.rotateZ(viewMatrix, viewMatrix, degreesToRadians(-90));
    		}));
    	}

    	if (y == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['yellow'], function() {
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [0, -state.stickerDepth, 0]);
    			mat4.rotateX(viewMatrix, viewMatrix, degreesToRadians(-180));
    		}));
    	} else if (y == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['white'], function(){
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [0, state.stickerDepth, 0]);
    		}));
    	}

    	if (z == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['blue'], function(){
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [0, 0, -state.stickerDepth]);
    			mat4.rotateX(viewMatrix, viewMatrix, degreesToRadians(-90));
    		}));
    	} else if (z == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['green'], function() {
    			this.cube.rotate();
    			mat4.translate(viewMatrix, viewMatrix, [0, 0, state.stickerDepth]);
    			mat4.rotateX(viewMatrix, viewMatrix, degreesToRadians(90));
    		}));
    	}
    	setUniforms();
    	setLighting();
    }

    this.draw = function(color) {
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, viewMatrix);
        this.rotate();
        setUniforms();
        setLighting(color);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeVertexBuffer);
        gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);
 		
        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeNormalsBuffer);
        gl.vertexAttribPointer(program.vertNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.cubeIndicesBuffer);
        gl.drawElements(gl.TRIANGLES, getCubeIndices().length, gl.UNSIGNED_SHORT, 0);

        mat4.copy(viewMatrix, mvMatrix);
    }

    this.init();
}