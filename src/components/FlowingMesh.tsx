import React from 'react';

export const FlowingMesh: React.FC = () => {
  // Generate 52 parametric guilloche lines extending seamlessly off-screen (-300 to 1900)
  const lineCount = 52;
  const lines = Array.from({ length: lineCount }).map((_, i) => {
    const u = i / (lineCount - 1); // 0 to 1

    // Guide control points extending beyond 100% viewport width
    const y0 = 40 + u * 380;
    const y1 = 180 + (u - 0.5) * 160 + Math.sin(u * Math.PI) * 40;
    const y2 = 290 + (u - 0.5) * 140 - Math.cos(u * Math.PI) * 50;
    const y3 = 200 + (u - 0.5) * 100 + Math.sin(u * Math.PI * 1.5) * 60;
    const y4 = 310 + (u - 0.5) * 60;

    const path = `M -300,${y0} C 200,${y1} 600,${y2} 1000,${y3} S 1400,${y4} 1900,${y4}`;
    const opacity = 0.08 + Math.sin(u * Math.PI) * 0.52;
    const strokeWidth = 0.75 + Math.sin(u * Math.PI) * 0.75;

    return { id: i, path, opacity, strokeWidth };
  });

  return (
    <div
      className="w-full h-full absolute inset-0 select-none pointer-events-none overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.9) 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 12%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.9) 88%, transparent 100%)'
      }}
    >
      <svg
        viewBox="0 0 1600 450"
        className="w-full h-full object-cover text-neutral-900 dark:text-white opacity-85 dark:opacity-90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Full-Bleed Edge-to-Edge Guilloche Ribbon Waves */}
        <g>
          {lines.map((line) => (
            <path
              key={line.id}
              d={line.path}
              stroke="currentColor"
              strokeWidth={line.strokeWidth}
              strokeOpacity={line.opacity}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Scattered Plus (+) Crosshairs across full width */}
        <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round">
          <line x1="220" y1="50" x2="232" y2="50" />
          <line x1="226" y1="44" x2="226" y2="56" />
        </g>

        <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round">
          <line x1="420" y1="160" x2="432" y2="160" />
          <line x1="426" y1="154" x2="426" y2="166" />
        </g>

        <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round">
          <line x1="750" y1="390" x2="762" y2="390" />
          <line x1="756" y1="384" x2="756" y2="396" />
        </g>

        <g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round">
          <line x1="1350" y1="110" x2="1362" y2="110" />
          <line x1="1356" y1="104" x2="1356" y2="116" />
        </g>

        {/* Scattered Accent Rings (o) */}
        <circle cx="580" cy="240" r="3.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
        <circle cx="920" cy="345" r="3" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.45" fill="none" />
        <circle cx="1450" cy="270" r="4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
      </svg>
    </div>
  );
};
