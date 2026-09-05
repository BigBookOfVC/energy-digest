/* ============================================================
   Energy Digest: fluid gradient blob
   Shared WebGL background. Used by / and /podcast/.

   Usage:
     <canvas id="blob"></canvas>
     <script src="assets/blob.js"><\/script>
     <script>initBlob(document.getElementById('blob'));<\/script>

   Pass a second argument to override any BLOB_CONFIG value:
     initBlob(canvas, { size: 70, colorA: '#01497C' });
   ============================================================ */

/* ---- CONFIG: the locked settings. Values are 0–100. ---- */
const BLOB_CONFIG = {
  cream:      '#F7EFE7',   // must match --cream in the page CSS
  colorA:     '#D99114',   // amber: the dominant wash
  colorB:     '#12756E',   // teal: the cooler patches
  colorC:     '#E9CC6F',   // pale amber: base tint inside the blob

  size:        92,         // how much of the frame the blob fills
  edge:        70,         // edge feathering; higher = softer dissolve
  flow:        20,         // speed of the interior churn
  turbulence:  34,         // how hard the interior folds
  drift:       27,         // how much the outline wanders
  grain:       27          // film grain strength
};

/* Alternative palette matching the tracker page's blues.
   Swap these into BLOB_CONFIG above if you want one look across the site:
     cream: '#DDEDF4', colorA: '#01497C', colorB: '#2A6F97', colorC: '#89C2D9'
   Remember to change --cream in the page CSS to match. */

const BLOB_VERT = 'attribute vec2 pos; void main(){ gl_Position = vec4(pos,0.0,1.0); }';

const BLOB_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uShapeT, uFlowT, uSize, uSoft, uTurb, uDrift, uGrain;
uniform vec3 uCream, uA, uB, uC;

vec2 hash(vec2 p){
  p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                 dot(hash(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
             mix(dot(hash(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                 dot(hash(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6,1.2,-1.2,1.6);
  for(int i = 0; i < 5; i++){ v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  /* LAYER 1: silhouette: slow, low frequency, defines the soft circle */
  float st = uShapeT;
  vec2 e = vec2(uv.x * 0.70, uv.y);
  e += uDrift * vec2(fbm(e * 1.6 + st * 0.5), fbm(e * 1.6 + vec2(5.0, 2.4) - st * 0.4));
  float d = length(e);
  float radius = uSize * (1.0 + 0.10 * fbm(e * 2.2 + st));
  float mask = smoothstep(radius, radius * (1.0 - uSoft), d);

  /* LAYER 2: interior: faster, domain-warped, churns independently */
  float ft = uFlowT;
  vec2 p = uv * 2.6;
  vec2 q = vec2(fbm(p + 0.30 * ft), fbm(p + vec2(3.1, 7.7) - 0.26 * ft));
  vec2 r = vec2(fbm(p + uTurb * q + vec2(1.7, 9.2) + 0.19 * ft),
                fbm(p + uTurb * q + vec2(8.3, 2.8) - 0.16 * ft));
  float f = fbm(p + uTurb * r + 0.12 * ft);

  vec3 col = uC;
  col = mix(col, uA, clamp(smoothstep(-0.28, 0.42, f) * 1.15, 0.0, 1.0));
  col = mix(col, uB, clamp(smoothstep(0.02, 0.88, length(r) * 1.15), 0.0, 1.0));
  col = mix(col, uCream, clamp(0.42 - f * 1.4, 0.0, 1.0) * 0.8);

  vec3 outc = mix(uCream, col, clamp(mask, 0.0, 1.0));

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  outc += (g - 0.5) * uGrain;

  gl_FragColor = vec4(outc, 1.0);
}`;

function initBlob(canvas, overrides){
  if(!canvas) return;
  var C = Object.assign({}, BLOB_CONFIG, overrides || {});

  var hex = function(h){
    var n = parseInt(h.replace('#',''), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  };

  var gl = canvas.getContext('webgl', { antialias:false, alpha:false });

  /* No WebGL: fall back to a static CSS gradient so the page still reads right */
  if(!gl){
    canvas.style.background =
      'radial-gradient(52% 46% at 48% 50%, ' + C.colorA + 'cc, transparent 72%), ' + C.cream;
    return;
  }

  var compile = function(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, BLOB_VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, BLOB_FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = function(n){ return gl.getUniformLocation(prog, n); };
  var u = {
    res:U('uRes'), shapeT:U('uShapeT'), flowT:U('uFlowT'), size:U('uSize'),
    soft:U('uSoft'), turb:U('uTurb'), drift:U('uDrift'), grain:U('uGrain'),
    cream:U('uCream'), a:U('uA'), b:U('uB'), c:U('uC')
  };

  /* map the 0–100 config values onto the shader's real ranges, once */
  var S = {
    size:  0.16 + (C.size       / 100) * 0.38,
    soft:  0.10 + (C.edge       / 100) * 0.85,
    turb:  1.00 + (C.turbulence / 100) * 3.40,
    drift: (C.drift / 100) * 0.14,
    grain: (C.grain / 100) * 0.09,
    flowRate: 0.12 + (C.flow / 100) * 1.10
  };
  var CREAM = hex(C.cream), CA = hex(C.colorA), CB = hex(C.colorB), CC = hex(C.colorC);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);

  /* pause when scrolled out of view: saves battery on long pages */
  var visible = true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; },
      { threshold: 0 }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden) last = performance.now();
  });

  var shapeClock = 0, flowClock = 0, last = performance.now();
  function frame(now){
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    if(visible && !document.hidden){
      var damp = reduce ? 0.06 : 1.0;
      shapeClock += dt * 0.10 * damp;
      flowClock  += dt * S.flowRate * damp;
      resize();

      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.shapeT, shapeClock);
      gl.uniform1f(u.flowT, flowClock);
      gl.uniform1f(u.size, S.size);
      gl.uniform1f(u.soft, S.soft);
      gl.uniform1f(u.turb, S.turb);
      gl.uniform1f(u.drift, S.drift);
      gl.uniform1f(u.grain, S.grain);
      gl.uniform3fv(u.cream, CREAM);
      gl.uniform3fv(u.a, CA);
      gl.uniform3fv(u.b, CB);
      gl.uniform3fv(u.c, CC);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);
}
