// Keep the previous rendered frame on the GPU for a short broadcast dissolve.
window.HorseDaysDissolve=function(gl){
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D frame;uniform float opacity;void main(){vec4 c=texture2D(frame,uv);gl_FragColor=vec4(c.rgb,c.a*opacity);}'));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 const loc=gl.getAttribLocation(p,'p'),alpha=gl.getUniformLocation(p,'opacity'),sampler=gl.getUniformLocation(p,'frame'),quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const textures=[gl.createTexture(),gl.createTexture()];let write=0,fade=1,width=0,height=0,valid=false,start=-10000;
 return {draw(now,w,h,cut){if(w!==width||h!==height){width=w;height=h;valid=false;for(const tex of textures){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);}start=-10000;}
 if(cut&&valid){fade=write;write=1-write;start=now;}
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,textures[write]);gl.copyTexSubImage2D(gl.TEXTURE_2D,0,0,0,0,0,w,h);valid=true;
 const opacity=1-(now-start)/220;if(opacity>0){gl.useProgram(p);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.bindTexture(gl.TEXTURE_2D,textures[fade]);gl.uniform1i(sampler,3);gl.uniform1f(alpha,opacity);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.disable(gl.BLEND);gl.depthMask(true);}
 gl.activeTexture(gl.TEXTURE0);
 }};
};
