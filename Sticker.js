function Sticker(cube, color, rotate){
    /* wrapper class for face color of each cube */
    
    this.cube = cube;
    this.color = color;
    this.rotate = rotate;

    this.draw = function() {
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, viewMatrix);
        this.rotate();
        setUniforms();
        setLighting(this.color);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerVertexBuffer);
        gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerNormalsBuffer);
        gl.vertexAttribPointer(program.vertNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.stickerIndicesBuffer);
        gl.drawElements(gl.TRIANGLES, getStickerIndices().length, gl.UNSIGNED_SHORT, 0);

        mat4.copy(viewMatrix, mvMatrix);
    }
}