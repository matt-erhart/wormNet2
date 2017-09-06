precision mediump float;
attribute vec3 propagationSources, propagationTargets, propagationColors;
attribute vec2 startEndTimes; //points to interpolate between
attribute float color01; //color map value between 0 and 1
varying vec4 color01_v2f; // vertex 2 frag
uniform float aspect, elapsedTime, radius; //interp 0-1
varying float progress01;
uniform mat4 projection, view, model;

void main () {
    if (startEndTimes[0] <= elapsedTime && startEndTimes[1] >= elapsedTime) {
      progress01 = (elapsedTime - startEndTimes[0]) / (startEndTimes[1] - startEndTimes[0]);
      vec3 pos = mix(propagationSources, propagationTargets, progress01);
      gl_Position = projection * view * model * vec4(pos.x, pos.y * aspect, pos.z, 1);          
      gl_PointSize = radius;
    } else {
      gl_Position = vec4(-100, -1000, -1000, 1);
      gl_PointSize = 0.0;
    }
    color01_v2f = vec4(propagationColors,1); //varying passes to frag
}