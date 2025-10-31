import type { SVGProps } from 'react';

export function TreeViewLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={32}
      height={32}
      {...props}
    >
      <path d="M12.45 2.22a2.5 2.5 0 0 0-3.9 0L2.22 8.55a2.5 2.5 0 0 0 0 3.9l6.33 6.33a2.5 2.5 0 0 0 3.9 0l6.33-6.33a2.5 2.5 0 0 0 0-3.9L12.45 2.22Z" />
    </svg>
  );
}
