"use client";

import React, { Component, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 1. Preemptively check if the browser supports WebGL (Hardware Acceleration enabled)
// This prevents Three.js from throwing a console error and triggering the Next.js Dev Overlay!
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// 2. Error Boundary (As a final safety net)
class WebGLErrorBoundary extends Component<{children: React.ReactNode}, { hasError: boolean }> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("WebGL failed to initialize. Safely falling back to CSS backgrounds.");
  }

  render() {
    if (this.state.hasError) {
      return null; 
    }
    return this.props.children;
  }
}

// 3. Dynamic imports with SSR strictly disabled
const DynamicShader = dynamic(() => import('@/components/BackgroundShader'), { ssr: false });
const DynamicCursor = dynamic(() => import('@/components/CursorEffects'), { ssr: false });

// 4. Safe Exported Wrappers
export function BackgroundShader(props: any) {
   const [canRender, setCanRender] = useState(false);
   
   useEffect(() => {
     // Only mount the 3D Shader if the browser physically supports it
     if (isWebGLAvailable()) {
        setCanRender(true);
     } else {
        console.warn("Hardware Acceleration is disabled in this browser. Shaders skipped.");
     }
   }, []);

   if (!canRender) return null;

   return (
     <WebGLErrorBoundary>
       <DynamicShader {...props} />
     </WebGLErrorBoundary>
   );
}

export function CursorEffects(props: any) {
   const [canRender, setCanRender] = useState(false);
   
   useEffect(() => {
     if (isWebGLAvailable()) {
        setCanRender(true);
     }
   }, []);

   if (!canRender) return null;

   return (
     <WebGLErrorBoundary>
       <DynamicCursor {...props} />
     </WebGLErrorBoundary>
   );
}