import type { SVGProps } from 'react';

export function TreeViewLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 48 48"
    >
      <defs>
        <linearGradient
          id="frameGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: '#5a9a5a', stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: '#3a7a3a', stopOpacity: 1 }}
          />
        </linearGradient>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="1" dy="1" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M24 4 L40 20 A 4 4 0 0 1 40 28 L28 40 A 4 4 0 0 1 20 40 L8 28 A 4 4 0 0 1 8 20 Z"
        fill="url(#frameGradient)"
        stroke="#3a7a3a"
        strokeWidth="1.5"
      />
      <g filter="url(#dropShadow)">
        <path
          d="M24 16 l-8 8 h4 v8 h8 v-8 h4 z"
          fill="#5c3c20"
          stroke="#4a2a0e"
          strokeWidth="0.5"
        />
        <path
          d="M24 12 L16 20 H32 Z"
          fill="#34a853"
          stroke="#2a8c4a"
          strokeWidth="0.5"
        />
        <path
          d="M24 18 L18 26 H30 Z"
          fill="#34a853"
          stroke="#2a8c4a"
          strokeWidth="0.5"
        />
        <path
          d="M24 24 L20 32 H28 Z"
          fill="#34a853"
          stroke="#2a8c4a"
          strokeWidth="0.5"
        />
        <path d="M24 12 l-5 6 h10z" fill="#4cd964" />
        <path d="M24 18 l-4 6 h8z" fill="#4cd964" />
        <path d="M24 24 l-3 6 h6z" fill="#4cd964" />
      </g>
    </svg>
  );
}
