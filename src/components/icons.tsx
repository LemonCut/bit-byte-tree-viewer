import Image from 'next/image';
import type { ComponentProps } from 'react';

// Explicitly define the props for the logo component.
// This allows passing any standard Image prop except for 'src' and 'alt'.
type TreeViewLogoProps = Omit<ComponentProps<typeof Image>, 'src' | 'alt'>;

export function TreeViewLogo(props: TreeViewLogoProps) {
  // The src path must be a root-relative path to the image in the `public` directory.
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
