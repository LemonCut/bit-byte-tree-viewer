import Image from 'next/image';
import type { Omit } from 'react';

// Define the props for the new logo component, excluding 'src' and 'alt'
// as they will be set internally. We'll allow other Image props to be passed.
type ImageProps = Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>;

export function TreeViewLogo(props: ImageProps) {
  // The src path is relative to the `public` directory.
  return (
    <Image
      src="/images/logo.png"
      alt="TreeView Logo"
      width={32} // Default width, can be overridden by props
      height={32} // Default height, can be overridden by props
      {...props}
    />
  );
}
