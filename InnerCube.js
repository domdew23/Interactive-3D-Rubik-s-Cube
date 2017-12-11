function InnerCube(){
    this.COLORS = {
        'blue': [0.0, 0.0, 1.0, 1.0],
        'green': [0.0, 1.0, 0.0, 1.0],
        'orange': [1.0, 0.5, 0.0, 1.0],
        'red': [1.0, 0.0, 0.0, 1.0],
        'black': [0.0, 0.0, 0.0, 1.0],
        'yellow': [1.0, 1.0, 0.0, 1.0]
    }

    this.NORMALS = {
        'blue': [-1, 0, 0],
        'green': [0, 0, -1],
        'orange': [1, 0, 0],
        'red': [0, 0, 1],
        'black': [0, -1, 0],
        'yellow': [0, 1, 0]
    }

    this.normalsFrameBuffer = null;
    this.normalsTexture = null;
 	this.normalsRenderBuffer = null;

	this.init = function(){
		this.initTextureFramebuffer();
		createInnerCubeBuffer();
	}

	this.draw = function(){
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, viewMatrix);
        mat4.scale(viewMatrix, viewMatrix, [3, 3, 3]);
        setMatrixUniforms();

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.innerCubeVertexBuffer);
        gl.vertexAttribPointer(program.vertPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.innerCubeNormalsBuffer);
        gl.vertexAttribPointer(program.vertNormal, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.innerCubeFacesBuffer);
        
        var offset = 0;
        for (c in this.COLORS) {
            var color = this.COLORS[c];
            gl.uniform4fv(program.ambient, this.COLORS[c]);
            gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, offset);
            gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, offset + getInnerCubeFaces().length);
            offset += 6;
        }
        mat4.copy(viewMatrix, mvMatrix);
	}

	this.initTextureFramebuffer = function() {
        this.normalsFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.normalsFramebuffer);

        this.normalsTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.normalsTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
     
        this.normalsRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.normalsRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.normalsTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.normalsRenderBuffer);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    this.colorToNormal = function(rgba) {
        var r = (rgba[0] / 255).toFixed(1);
        var g = (rgba[1] / 255).toFixed(1);
        var b = (rgba[2] / 255).toFixed(1);
        for (var c in this.COLORS) {
            var color = this.COLORS[c];
            if (r == color[0] && g == color[1] && b == color[2]) {
                return this.NORMALS[c];
            }
        }
        return null;
    }

    this.getNormal = function(x, y) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.normalsFramebuffer);
        var pixelValues = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return this.colorToNormal(pixelValues);
    }

	this.init();
}
