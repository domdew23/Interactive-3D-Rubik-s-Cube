function Sticker(cube, color, transform){
    this.cube = cube;
    this.color = color;
    this.transform = transform;

    this.draw = function() {
        var mvMatrix = mat4.create();
        mat4.copy(mvMatrix, viewMatrix);
        this.transform();
        setMatrixUniforms();

        gl.uniform4fv(program.ambient, this.color);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerVertexBuffer);
        gl.vertexAttribPointer(program.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, state.buffers.stickerNormalsBuffer);
        gl.vertexAttribPointer(program.vertNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state.buffers.stickerFacesBuffer);
        gl.drawElements(gl.TRIANGLES, getStickerFaces().length, gl.UNSIGNED_SHORT, 0);

        mat4.copy(viewMatrix, mvMatrix);
    }


}