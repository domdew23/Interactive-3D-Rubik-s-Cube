function Cube(rubiksCube, coordinates, color){
	this.rubiksCube = rubiksCube;
	this.coordinates = coordinates;
	this.color = color;

	this.stickers = [];
    this.COLORS = {
        'blue': [0.0, 0.0, 1.0, 1.0],
        'green': [0.0, 1.0, 0.0, 1.0],
        'orange': [1.0, 0.5, 0.0, 1.0],
        'red': [1.0, 0.0, 0.0, 1.0],
        'white': [1.0, 1.0, 1.0, 1.0],
        'yellow': [1.0, 1.0, 0.0, 1.0]
    }

    this.init = function(){
    	var x = this.coordinates[0];
    	var y = this.coordinates[1];
    	var z = this.coordinates[2];
    	
    	if (x == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['red']));
    	} else if (x == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['orange']));
    	}

    	if (y == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['yellow']));
    	} else if (y == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['white']));
    	}

    	if (z == -1){
    		this.stickers.push(new Sticker(this, this.COLORS['blue']));
    	} else if (z == 1){
    		this.stickers.push(new Sticker(this, this.COLORS['green']));
    	}
    }

	this.draw = function(color) {
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, modelViewMatrix);
        setMatrixUniforms();
    
        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.cubeVerticesBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0);
 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.cubeFacesBuffer);
        gl.drawElements(gl.TRIANGLES, getCubeFaces().length, gl.UNSIGNED_SHORT, 0);

        mat4.copy(modelViewMatrix, mvMatrix);
    }

    this.init();
}