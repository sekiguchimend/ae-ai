/**
 * Lazy-loaded Components for Code Splitting
 * Improves initial load time by deferring non-critical component loading
 */

import dynamic from 'next/dynamic';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="loading" />
  </div>
);

// Skeleton Editor - heavy component with tree view and SVG
export const LazySkeletonEditor = dynamic(
  () => import('@/components/skeleton/SkeletonEditor').then((mod) => ({ default: mod.SkeletonEditor })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// Constraint Editor - has SVG visualizations
export const LazyConstraintEditor = dynamic(
  () => import('@/components/constraints/ConstraintEditor').then((mod) => ({ default: mod.ConstraintEditor })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// Style Editor - color pickers and preview
export const LazyStyleEditor = dynamic(
  () => import('@/components/styles/StyleEditor').then((mod) => ({ default: mod.StyleEditor })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// Animation Preset Form - keyframe editor
export const LazyAnimationPresetForm = dynamic(
  () => import('@/components/presets/AnimationPresetForm').then((mod) => ({ default: mod.AnimationPresetForm })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// Version Comparison - diff view
export const LazyVersionComparison = dynamic(
  () => import('@/components/versions/VersionComparison').then((mod) => ({ default: mod.VersionComparison })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);

// Create Character Modal
export const LazyCreateCharacterModal = dynamic(
  () => import('@/components/characters/CreateCharacterModal').then((mod) => ({ default: mod.CreateCharacterModal })),
  {
    loading: LoadingFallback,
    ssr: false,
  }
);
