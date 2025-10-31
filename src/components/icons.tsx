import type { SVGProps } from 'react';

export function TreeViewLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12v10" />
      <path d="M12 5.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M19 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="m5 12 7-6.5" />
      <path d="m19 12-7-6.5" />
    </svg>
  );
}
