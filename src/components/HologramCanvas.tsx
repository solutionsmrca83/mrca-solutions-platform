import React, { useEffect, useRef, useState } from 'react';

interface HologramCanvasProps {
  className?: string;
}

export const HologramCanvas: React.FC<HologramCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState('60.0');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          canvas.width = w * window.devicePixelRatio;
          canvas.height = h * window.devicePixelRatio;
          width = canvas.width;
          height = canvas.height;
        }
      }
    });

    resizeObserver.observe(canvas);

    // Holographic wireframe nodes (Icosahedron base projection)
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    // Edges connecting nodes
    const edges: [number, number][] = [];
    for (let i = 0; i < baseVertices.length; i++) {
      for (let j = i + 1; j < baseVertices.length; j++) {
        const dx = baseVertices[i][0] - baseVertices[j][0];
        const dy = baseVertices[i][1] - baseVertices[j][1];
        const dz = baseVertices[i][2] - baseVertices[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - 2) < 0.1) {
          edges.push([i, j]);
        }
      }
    }

    let angleX = 0.25;
    let angleY = 0.45;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const handlePointerDown = (clientX: number, clientY: number) => {
      isDragging = true;
      lastX = clientX;
      lastY = clientY;
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - lastX;
      const dy = clientY - lastY;
      angleY += dx * 0.012;
      angleX += dy * 0.012;
      lastX = clientX;
      lastY = clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    // Event listeners
    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    const render = (now: number) => {
      // FPS measurement
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        const measuredFps = ((frameCount * 1000) / (now - lastFpsUpdate)).toFixed(1);
        setFps(measuredFps);
        frameCount = 0;
        lastFpsUpdate = now;
      }
      lastFrameTime = now;

      if (!isDragging) {
        angleY += 0.007;
        angleX += 0.0025;
      }

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.28;

      // Draw Gyroscopic Green Orbit Ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * 2.2, scale * 0.72, angleY * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 254, 102, 0.38)';
      ctx.lineWidth = 1.4 * window.devicePixelRatio;
      ctx.stroke();

      // Outer secondary faint ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * 2.5, scale * 0.9, -angleY * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 1.0 * window.devicePixelRatio;
      ctx.stroke();

      // Rotate & Project Vertices
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);

      const projected = baseVertices.map((v) => {
        const x = v[0], y = v[1], z = v[2];

        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const fov = 300 / (300 + z2 * scale * 0.3);
        return {
          x: cx + x1 * scale * fov,
          y: cy + y2 * scale * fov,
          z: z2,
        };
      });

      // Draw Cyan Edges
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
      ctx.lineWidth = 1.3 * window.devicePixelRatio;
      for (let i = 0; i < edges.length; i++) {
        const p1 = projected[edges[i][0]];
        const p2 = projected[edges[i][1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Glowing Nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const depthAlpha = Math.max(0.3, Math.min(1, (p.z + 2) / 4));
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${depthAlpha})`;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10 * window.devicePixelRatio;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Core Center Glow Point
      ctx.beginPath();
      ctx.arc(cx, cy, 5 * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = '#00fe66';
      ctx.shadowColor = '#00fe66';
      ctx.shadowBlur = 14 * window.devicePixelRatio;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
        width={380}
        height={320}
      />
      {/* Overlay badges matching exact designs */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222941]/90 border border-[#00e5ff]/20 backdrop-blur-md">
        <span className="material-symbols-outlined text-[#00e5ff] text-[14px]">stream</span>
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#00e5ff] font-semibold tracking-wider">
          CORE_QUANTUM::ONLINE
        </span>
      </div>
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded bg-[#222941]/90 border border-[#00e5ff]/20 backdrop-blur-md">
        <span className="font-['JetBrains_Mono'] text-[12px] text-[#00fe66] font-semibold">
          FPS {fps}
        </span>
      </div>
      <div className="absolute bottom-3 left-3 z-20">
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#bac9cc] flex items-center gap-1 bg-[#141a32]/70 px-2 py-0.5 rounded backdrop-blur-sm">
          <span className="material-symbols-outlined text-[12px] text-[#00e5ff]">touch_app</span> Desliza para orbitar núcleo
        </span>
      </div>
    </div>
  );
};
