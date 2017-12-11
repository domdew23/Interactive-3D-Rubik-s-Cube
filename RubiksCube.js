function RubiksCube() {
	this.cubes = new Array(3);

	this.init = function(){
		createCubeBuffer();
		createStickerBuffer();
		for (x = 0; x < 3; x++){
			cubes[x] = new Array(3);
			for (y = 0; y < 3; y++){
				cubes[x][y] = new Array(3) ;
				for (z = 0; z < 3; z++){
					var coordinates = [x - 1, y - 1, z - 1];
					var color = [x / 3, y / 3, z / 3, 1.0];
					cubes[x][y][z] = new Cube(this, coordinates, color);
				}
			}
		}
	}

	this.draw = function(){
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		for (x = 0; x < 3; x++){
			for (y = 0; y < 3; y++){
				for (z = 0; z < 3; z++){
					var cube = this.cubes[x][y][z];
					cube.draw();
					for (s in cube.stickers){
						cube.stickers[s].draw();
					}
				}
			}
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

