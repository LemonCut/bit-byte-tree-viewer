
import { Suspense } from 'react';
import { TreeViewerPage } from '@/app/tree-viewer-page';
import { PageLoader } from '@/components/page-loader';

export default function Home() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TreeViewerPage />
    </Suspense>
  );
}
