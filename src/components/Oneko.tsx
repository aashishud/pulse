"use client";

import { useEffect } from 'react';

const SKINS: Record<string, string> = {
  "oneko": "/pets/classic.gif",
  "oneko-black": "/pets/classic.gif",
  "oneko-dog": "/pets/dog.gif",
  "oneko-tora": "/pets/tora.gif",
  "oneko-maia": "/pets/maia.gif",
  "oneko-vaporwave": "/pets/vaporwave.gif",
};

export default function Oneko({ skin = "oneko" }: { skin?: string }) {
  useEffect(() => {
    // Prevent duplicate pets
    const existingNeko = document.getElementById("oneko");
    if (existingNeko) existingNeko.remove();

    const nekoEl = document.createElement("div");
    let nekoPosX = Math.random() * (window.innerWidth - 32);
    let nekoPosY = Math.random() * (window.innerHeight - 32);
    let mousePosX = nekoPosX;
    let mousePosY = nekoPosY;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: string | null = null;
    let idleAnimationFrame = 0;
    const nekoSpeed = 12;
    let isGrabbed = false;
    
    // Smooth drag state
    let lastGrabX = 0;
    let lastGrabY = 0;
    let currentGrabDir = "alert";
    let grabStateTicks = 0;

    const spriteSets: Record<string, number[][]> = {
      idle: [[-3, -3]],
      alert: [[-7, -3]],
      scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
      scratchWallN: [[0, 0], [0, -1]],
      scratchWallS: [[-7, -1], [-6, -2]],
      scratchWallE: [[-2, -2], [-2, -3]],
      scratchWallW: [[-4, 0], [-4, -1]],
      tired: [[-3, -2]],
      sleeping: [[-2, 0], [-2, -1]],
      N: [[-1, -2], [-1, -3]],
      NE: [[0, -2], [0, -3]],
      E: [[-3, 0], [-3, -1]],
      SE: [[-5, -1], [-5, -2]],
      S: [[-6, -3], [-7, -2]],
      SW: [[-5, -3], [-6, -1]],
      W: [[-4, -2], [-4, -3]],
      NW: [[-1, 0], [-1, -1]],
    };

    function create() {
      nekoEl.id = "oneko";
      nekoEl.style.width = "32px";
      nekoEl.style.height = "32px";
      nekoEl.style.position = "fixed";
      nekoEl.style.top = "0px";
      nekoEl.style.left = "0px";
      nekoEl.style.pointerEvents = "auto";
      nekoEl.style.cursor = "grab";
      nekoEl.style.backgroundImage = `url('${SKINS[skin] || SKINS.oneko}')`;
      nekoEl.style.imageRendering = "pixelated";
      nekoEl.style.zIndex = "9999";
      nekoEl.style.transform = `translate3d(${nekoPosX}px, ${nekoPosY}px, 0)`;
      nekoEl.style.backgroundSize = "256px 128px"; // Explicitly set to prevent scaling glitches

      if (skin === "oneko-black") {
        nekoEl.style.filter = "invert(100%) brightness(1.5)";
      }
      
      document.body.appendChild(nekoEl);

      const handleMouseMove = (event: MouseEvent) => {
        if (isGrabbed) {
          nekoPosX = event.clientX - 16;
          nekoPosY = event.clientY - 16;
          nekoEl.style.transform = `translate3d(${nekoPosX}px, ${nekoPosY}px, 0)`;
        } else {
          mousePosX = event.clientX;
          mousePosY = event.clientY;
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        isGrabbed = true;
        nekoEl.style.cursor = "grabbing";
        nekoEl.style.pointerEvents = "none"; 
        lastGrabX = nekoPosX;
        lastGrabY = nekoPosY;
        grabStateTicks = 0;
      };

      const handleMouseUp = () => {
        if (isGrabbed) {
          isGrabbed = false;
          nekoEl.style.cursor = "grab";
          nekoEl.style.pointerEvents = "auto";
          idleTime = 0;
          mousePosX = nekoPosX + 16;
          mousePosY = nekoPosY + 16;
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      nekoEl.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);

      let lastFrameTimestamp = performance.now();
      function onAnimationFrame(timestamp: number) {
        if (!nekoEl.isConnected) return;
        if (timestamp - lastFrameTimestamp > 100) {
          lastFrameTimestamp = timestamp;
          if (isGrabbed) {
            frameCount++;
            
            const dx = nekoPosX - lastGrabX;
            const dy = nekoPosY - lastGrabY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 3) {
              grabStateTicks = 0;
              // Smoother direction lock
              let newDir = "";
              if (Math.abs(dx) > Math.abs(dy)) {
                newDir = dx > 0 ? "scratchWallW" : "scratchWallE";
              } else {
                newDir = dy > 0 ? "scratchWallN" : "scratchWallS";
              }
              currentGrabDir = newDir;
              setSprite(currentGrabDir, frameCount);
            } else {
              grabStateTicks++;
              // Only switch to alert if stationary for a bit
              if (grabStateTicks > 2) {
                setSprite("alert", 0);
              } else {
                setSprite(currentGrabDir, frameCount);
              }
            }
            
            lastGrabX = nekoPosX;
            lastGrabY = nekoPosY;
          } else {
            frame();
          }
        }
        window.requestAnimationFrame(onAnimationFrame);
      }
      window.requestAnimationFrame(onAnimationFrame);
    }

    function setSprite(name: string, frame: number) {
      const sprite = spriteSets[name][frame % spriteSets[name].length];
      if (!sprite) return;
      nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    }

    function resetIdleAnimation() {
      idleAnimation = null;
      idleAnimationFrame = 0;
    }

    function idle() {
      idleTime += 1;
      // Much faster idle triggers: 3 ticks and 1/40 chance
      if (idleTime > 3 && Math.floor(Math.random() * 40) === 0 && idleAnimation === null) {
        let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
        if (nekoPosX < 32) avalibleIdleAnimations.push("scratchWallW");
        if (nekoPosY < 32) avalibleIdleAnimations.push("scratchWallN");
        if (nekoPosX > window.innerWidth - 64) avalibleIdleAnimations.push("scratchWallE");
        if (nekoPosY > window.innerHeight - 64) avalibleIdleAnimations.push("scratchWallS");
        idleAnimation = avalibleIdleAnimations[Math.floor(Math.random() * avalibleIdleAnimations.length)];
      }

      switch (idleAnimation) {
        case "sleeping":
          if (idleAnimationFrame < 8) { setSprite("tired", 0); break; }
          setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
          if (idleAnimationFrame > 192) resetIdleAnimation();
          break;
        case "scratchWallN": case "scratchWallS": case "scratchWallE": case "scratchWallW": case "scratchSelf":
          setSprite(idleAnimation, idleAnimationFrame);
          if (idleAnimationFrame > 9) resetIdleAnimation();
          break;
        default:
          setSprite("idle", 0);
          return;
      }
      idleAnimationFrame += 1;
    }

    function frame() {
      frameCount += 1;
      const diffX = (nekoPosX + 16) - mousePosX;
      const diffY = (nekoPosY + 16) - mousePosY;
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

      if (distance < nekoSpeed || distance < 48) {
        idle();
        return;
      }

      idleAnimation = null;
      idleAnimationFrame = 0;

      if (idleTime > 1) {
        setSprite("alert", 0);
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        return;
      }
      
      idleTime = 0; // Ensure idleTime is 0 while moving

      let direction = "";
      direction = diffY / distance > 0.5 ? "N" : "";
      direction += diffY / distance < -0.5 ? "S" : "";
      direction += diffX / distance > 0.5 ? "W" : "";
      direction += diffX / distance < -0.5 ? "E" : "";
      
      if (!direction) {
          idle();
          return;
      }
      
      setSprite(direction, frameCount);

      nekoPosX -= (diffX / distance) * nekoSpeed;
      nekoPosY -= (diffY / distance) * nekoSpeed;

      nekoPosX = Math.min(Math.max(0, nekoPosX), window.innerWidth - 32);
      nekoPosY = Math.min(Math.max(0, nekoPosY), window.innerHeight - 32);

      nekoEl.style.transform = `translate3d(${nekoPosX}px, ${nekoPosY}px, 0)`;
    }

    create();

    return () => {
      nekoEl.remove();
    };
  }, [skin]);

  return null;
}