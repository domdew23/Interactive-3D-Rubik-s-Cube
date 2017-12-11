function Sticker(cube, color){
    this.cube = cube;
    this.color = color;

    draw = function() {
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, modelViewMatrix)
        setMatrixUniforms();

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerVertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.stickerFacesBuffer);
        gl.drawElements(gl.TRIANGLES, getStickerFaces().length, gl.UNSIGNED_SHORT, 0);

        mat4.copy(modelViewMatrix, mvMatrix);
    }


}