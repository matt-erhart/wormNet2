precision mediump float;
#pragma glslify: colormap = require(glsl-colormap/viridis)
varying float color01_v2f; //from the vertex shader
void main () {
    gl_FragColor = colormap(color01_v2f);
}