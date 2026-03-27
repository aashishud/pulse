"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// We declare the global window interface so TypeScript doesn't yell at us
declare global {
  interface Window {
    __liquidApp?: any;
    __liquidApps?: Record<string, any>;
  }
}

// --- NEW SHADER: LIQUID FLUID PHYSICS ---
function LiquidShaderAnimation({ backgroundImage }: { backgroundImage?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate a unique ID for this specific canvas instance to avoid React Strict Mode collisions
    const canvasId = 'liquid-canvas-' + Math.random().toString(36).substring(2, 9);
    canvasRef.current.id = canvasId;

    // Use the user's background image, or a sleek dark fallback if none exists
    const imageUrl = backgroundImage || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2600&auto=format&fit=crop';

    // Load the 3D fluid script dynamically
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import LiquidBackground from 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js';
      
      const canvas = document.getElementById('${canvasId}');
      if (canvas) {
        try {
          const app = LiquidBackground(canvas);
          
          const originalUrl = '${imageUrl}';
          // Use wsrv.nl proxy to forcefully bypass CORS restrictions for WebGL textures
          const proxyUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(originalUrl) + '&output=webp&w=1920';
          const fallbackUrl = 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2600&auto=format&fit=crop';
          
          // Tweak the fluid to look more like liquid glass rather than raw metal
          app.liquidPlane.material.metalness = 0.5;
          app.liquidPlane.material.roughness = 0.3;
          app.liquidPlane.uniforms.displacementScale.value = 3.0;
          app.setRain(false);
          
          // Attempt to load the user's image via the proxy to guarantee CORS
          const loadPromise = app.loadImage(proxyUrl);
          if (loadPromise && typeof loadPromise.catch === 'function') {
            loadPromise.catch(e => {
              console.warn('Proxy fluid image failed, attempting direct load...', e);
              const directPromise = app.loadImage(originalUrl);
              if (directPromise && typeof directPromise.catch === 'function') {
                directPromise.catch(err => {
                  console.warn('Direct fluid image failed (CORS), using fallback.', err);
                  app.loadImage(fallbackUrl);
                });
              }
            });
          }
          
          window.__liquidApps = window.__liquidApps || {};
          window.__liquidApps['${canvasId}'] = app;
        } catch (err) {
          console.warn('Liquid Background Error:', err);
        }
      }
    `;
    document.body.appendChild(script);

    return () => {
      if (window.__liquidApps && window.__liquidApps[canvasId]) {
        if (typeof window.__liquidApps[canvasId].dispose === 'function') {
          window.__liquidApps[canvasId].dispose();
        }
        delete window.__liquidApps[canvasId];
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [backgroundImage]);

  return (
    // Dropped opacity to 90 so the heavy dark gradients from the page.tsx can help with contrast
    <div className="absolute inset-0 w-full h-full pointer-events-none opacity-90">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// --- EXISTING SHADER (shader-animation) ---
function ThreeShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;
        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = renderer.domElement.width;
      uniforms.resolution.value.y = renderer.domElement.height;
    };

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none"
    />
  );
}

// --- PAPER SHADER ---
function PaperShaderAnimation({ primaryColor }: { primaryColor?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const vertexShader = `
      uniform float time;
      uniform float intensity;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        vec3 pos = position;
        pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
        pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform float intensity;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vec2 uv = vUv;
        
        // Create animated noise pattern
        float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
        noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
        
        // Mix colors based on noise and position
        vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
        color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);
        
        // Add glow effect
        float glow = 1.0 - length(uv - 0.5) * 2.0;
        glow = pow(glow, 2.0);
        
        gl_FragColor = vec4(color * glow, glow * 0.8);
      }
    `;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(5, 5, 32, 32); 
    
    const uniforms = {
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(primaryColor || "#6366f1") },
      color2: { value: new THREE.Color("#0a0a0c") } // Base background color
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.02; // Smooth flow speed
      uniforms.intensity.value = 1.0 + Math.sin(uniforms.time.value * 2) * 0.3;
      renderer.render(scene, camera);
      if (sceneRef.current) sceneRef.current.animationId = animationId;
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, [primaryColor]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none" />;
}

// --- ORIGINAL THREE.JS SPOOKY SMOKE ---
function SpookySmokeAnimation({ primaryColor }: { primaryColor?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec3 color1;

      float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
          float f = 0.0;
          float w = 0.5;
          for (int i = 0; i < 5; i++) {
              f += w * noise(p);
              p *= 2.0;
              w *= 0.5;
          }
          return f;
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          uv.x *= resolution.x / resolution.y;
          
          vec2 p = uv * 3.0;
          float t = time * 0.15;
          
          vec2 q = vec2(0.);
          q.x = fbm(p + vec2(0.0, 0.0) + t);
          q.y = fbm(p + vec2(5.2, 1.3) + t * 0.8);
          
          vec2 r = vec2(0.);
          r.x = fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 1.5);
          r.y = fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 1.2);
          
          float f = fbm(p + 4.0 * r);
          
          vec3 baseColor = color1; 
          vec3 darkColor = vec3(0.02, 0.02, 0.05);
          
          vec3 col = mix(darkColor, baseColor, clamp(f*f*3.5, 0.0, 1.0));
          col = mix(col, vec3(1.0, 1.0, 1.0), clamp(length(q), 0.0, 1.0) * 0.1);
          
          gl_FragColor = vec4(col, clamp(f * 1.8, 0.0, 1.0));
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2); 
    
    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2() },
      color1: { value: new THREE.Color(primaryColor || "#6366f1") },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = width;
      uniforms.resolution.value.y = height;
    };

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.02; 
      renderer.render(scene, camera);
      if (sceneRef.current) sceneRef.current.animationId = animationId;
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, [primaryColor]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none" />;
}

// --- NEW SHADER: RED SMOKE (Raw WebGL2 implementation provided by User) ---

const redSmokeFragmentShader = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);

  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);

  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);

  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));

  col=mix(vec3(.08),col,min(time*.1,1.));
  col=clamp(col,.08,1.);
  O=vec4(col,1);
}`;

const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : null;
};

class RedSmokeRenderer {
  private readonly vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
  private readonly vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private color: [number, number, number] = [0.5, 0.5, 0.5]; 

  constructor(canvas: HTMLCanvasElement, fragmentSource: string) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    this.setup(fragmentSource);
    this.init();
  }
  
  updateColor(newColor: [number, number, number]) {
    this.color = newColor;
  }

  updateScale() {
    const dpr = Math.max(1, window.devicePixelRatio);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private compile(shader: WebGLShader, source: string) {
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
    }
  }

  reset() {
    const { gl, program, vs, fs } = this;
    if (!program) return;
    if (vs) { gl.detachShader(program, vs); gl.deleteShader(vs); }
    if (fs) { gl.detachShader(program, fs); gl.deleteShader(fs); }
    gl.deleteProgram(program);
    this.program = null;
  }

  private setup(fragmentSource: string) {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!this.vs || !this.fs || !program) return;
    this.compile(this.vs, this.vertexSrc);
    this.compile(this.fs, fragmentSource);
    this.program = program;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(`Program linking error: ${gl.getProgramInfoLog(this.program)}`);
    }
  }

  private init() {
    const { gl, program } = this;
    if (!program) return;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    Object.assign(program, {
      resolution: gl.getUniformLocation(program, "resolution"),
      time: gl.getUniformLocation(program, "time"),
      u_color: gl.getUniformLocation(program, "u_color"), 
    });
  }

  render(now = 0) {
    const { gl, program, buffer, canvas } = this;
    if (!program || !gl.isProgram(program)) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
    gl.uniform1f((program as any).time, now * 1e-3);
    gl.uniform3fv((program as any).u_color, this.color); 
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function RedSmokeAnimation({ smokeColor = "#FF0000" }: { smokeColor?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<RedSmokeRenderer | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const renderer = new RedSmokeRenderer(canvas, redSmokeFragmentShader);
        rendererRef.current = renderer;
        
        const handleResize = () => renderer.updateScale();
        handleResize(); 
        window.addEventListener('resize', handleResize);
        
        let animationFrameId: number;
        const loop = (now: number) => {
            renderer.render(now);
            animationFrameId = requestAnimationFrame(loop);
        };
        loop(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.reset(); 
        };
    }, []);
    
    useEffect(() => {
        const renderer = rendererRef.current;
        if (renderer) {
            const rgbColor = hexToRgb(smokeColor);
            if (rgbColor) {
                renderer.updateColor(rgbColor);
            }
        }
    }, [smokeColor]);

    return (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none block" />
    );
}

// --- NEW SHADER: THERMODYNAMIC HEATMAP ---
function ThermodynamicGridAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let grid: Float32Array;
    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    
    const resolution = 12; 
    const coolingFactor = 0.96; 
    
    const mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false };

    // Heatmap Magma Colors
    const getThermalColor = (t: number) => {
      const r = Math.min(255, Math.max(0, t * 2.5 * 255));
      const g = Math.min(255, Math.max(0, (t * 2.5 - 1) * 255));
      const b = Math.min(255, Math.max(0, (t * 2.5 - 2) * 255 + (t * 50)));
      return `rgb(${r + 10}, ${g + 10}, ${b + 15})`;
    };

    const resize = () => {
      width = container.offsetWidth || window.innerWidth;
      height = container.offsetHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      cols = Math.ceil(width / resolution);
      rows = Math.ceil(height / resolution);
      grid = new Float32Array(cols * rows).fill(0);
    };

    // Tracks mouse even across the document, offsetting accurately for the canvas
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    let animationFrameId: number;
    let time = 0;

    const update = () => {
      time += 0.05;

      // Subtle wandering heat source (keeps background alive when idle)
      if (width > 0 && height > 0) {
         const autoX = (width / 2) + Math.cos(time * 0.4) * (width * 0.35);
         const autoY = (height / 2) + Math.sin(time * 0.6) * (height * 0.35);
         const cAuto = Math.floor(autoX / resolution);
         const rAuto = Math.floor(autoY / resolution);
         const radius = 3;
         for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
               const c = cAuto + i;
               const r = rAuto + j;
               if (c >= 0 && c < cols && r >= 0 && r < rows) {
                   const idx = c + r * cols;
                   const d = Math.sqrt(i*i + j*j);
                   if (d <= radius) {
                       grid[idx] = Math.min(1.0, grid[idx] + 0.15 * (1 - d/radius));
                   }
               }
            }
         }
      }

      // Brushing heat via mouse
      if (mouse.active) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const steps = Math.ceil(dist / (resolution / 2));
        
        for (let s = 0; s <= steps; s++) {
            const t = steps > 0 ? s / steps : 0;
            const x = mouse.prevX + dx * t;
            const y = mouse.prevY + dy * t;
            
            const col = Math.floor(x / resolution);
            const row = Math.floor(y / resolution);
            
            const radius = 2;
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    const c = col + i;
                    const r = row + j;
                    if (c >= 0 && c < cols && r >= 0 && r < rows) {
                        const idx = c + r * cols;
                        const d = Math.sqrt(i*i + j*j);
                        if (d <= radius) {
                            grid[idx] = Math.min(1.0, grid[idx] + 0.3 * (1 - d/radius));
                        }
                    }
                }
            }
        }
      }
      
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;

      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = c + r * cols;
          let temp = grid[idx];

          grid[idx] *= coolingFactor;

          if (temp > 0.05) {
             const x = c * resolution;
             const y = r * resolution;
             const size = resolution * (0.8 + temp * 0.5); 
             const offset = (resolution - size) / 2;
             
             ctx.fillStyle = getThermalColor(temp);
             ctx.beginPath();
             ctx.rect(x + offset, y + offset, size, size);
             ctx.fill();
          } else {
             if (c % 2 === 0 && r % 2 === 0) {
                 const x = c * resolution;
                 const y = r * resolution;
                 ctx.fillStyle = "#18181b"; 
                 ctx.fillRect(x + resolution/2 - 1, y + resolution/2 - 1, 2, 2);
             }
          }
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    resize();
    update();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none opacity-80 mix-blend-screen"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// --- MAIN EXPORT COMPONENT ---
export default function BackgroundShader({ type, primaryColor, backgroundImage }: { type: string, primaryColor?: string, backgroundImage?: string }) {
  if (!type || type === "none") return null;

  // Extract RGB from hex for CSS-based shaders
  let r = 99, g = 102, b = 241;
  if (primaryColor) {
    const hex = primaryColor.replace("#", "");
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 3) {
      r = parseInt(hex[0]+hex[0], 16);
      g = parseInt(hex[1]+hex[1], 16);
      b = parseInt(hex[2]+hex[2], 16);
    }
  }

  return (
    <>
      {type === "liquid" && <LiquidShaderAnimation backgroundImage={backgroundImage} />}
      {type === "shader-animation" && <ThreeShaderAnimation />}
      {type === "paper-shader" && <PaperShaderAnimation primaryColor={primaryColor} />}
      {type === "spooky-smoke" && <SpookySmokeAnimation primaryColor={primaryColor} />}
      {type === "red-smoke" && <RedSmokeAnimation smokeColor="#FF0000" />}
      {type === "thermodynamic" && <ThermodynamicGridAnimation />}

      {type === "mesh-gradient" && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin-gradient {
               0% { transform: rotate(0deg) scale(1.5); }
               100% { transform: rotate(360deg) scale(1.5); }
            }
            .animate-mesh-gradient {
               animation: spin-gradient 20s linear infinite;
            }
          `}} />
          <div className="absolute inset-[-50%] pointer-events-none opacity-40 mix-blend-screen animate-mesh-gradient"
               style={{
                 backgroundImage: `
                   radial-gradient(at 0% 0%, rgba(${r},${g},${b},0.5) 0px, transparent 50%),
                   radial-gradient(at 100% 0%, rgba(168,85,247,0.4) 0px, transparent 50%),
                   radial-gradient(at 100% 100%, rgba(${r},${g},${b},0.5) 0px, transparent 50%),
                   radial-gradient(at 0% 100%, rgba(236,72,153,0.4) 0px, transparent 50%)
                 `
               }}
          />
        </>
      )}

      {type === "aurora" && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes blob {
              0% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(50px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
              100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob { animation: blob 10s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
          `}} />
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen blur-[120px] animate-blob" style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, 0.6)` }}></div>
            <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/40 mix-blend-screen blur-[120px] animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-indigo-600/40 mix-blend-screen blur-[120px] animate-blob animation-delay-4000"></div>
          </div>
        </>
      )}

      {type === "cyber-grid" && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes grid-move {
              0% { transform: translateY(0) rotateX(70deg); }
              100% { transform: translateY(4rem) rotateX(70deg); }
            }
            .animate-grid {
               transform-origin: bottom center;
               animation: grid-move 3s linear infinite;
            }
          `}} />
          <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-[1000px] opacity-30">
            <div className="absolute bottom-0 left-[-50%] w-[200%] h-[200%] animate-grid"
                 style={{
                   backgroundImage: `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.4) 1px, transparent 1px)`,
                   backgroundSize: '4rem 4rem'
                 }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#111214] opacity-90"></div>
          </div>
        </>
      )}

      {type === "dots" && (
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{
               backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
               backgroundSize: '24px 24px'
             }}>
        </div>
      )}

      {type === "noise" && (
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>
      )}
    </>
  );
}