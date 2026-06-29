import React from 'react';

// ── Skeleton de base ───────────────────────────
const Bone = ({ className = '' }) => (
  <div className={`bg-zinc-800 animate-pulse rounded-lg ${className}`} />
);

// ── SongRow skeleton ──────────────────────────
export const SongListSkeleton = ({ count = 5 }) => (
  <div className="flex flex-col gap-2">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
        <Bone className="w-5 h-4 rounded" />
        <Bone className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3 w-3/4" />
          <Bone className="h-2.5 w-1/2" />
        </div>
        <Bone className="w-8 h-3 rounded" />
      </div>
    ))}
  </div>
);

// ── Card skeleton (albums, artistes) ──────────
export const CardSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="p-3 rounded-2xl bg-zinc-900/40 space-y-2">
        <Bone className="w-full aspect-square rounded-xl" />
        <Bone className="h-3.5 w-3/4" />
        <Bone className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);

// ── Artiste hero skeleton ──────────────────────
export const ArtistHeroSkeleton = () => (
  <div className="flex items-end gap-4 md:gap-6 mb-8 p-4 md:p-6 rounded-3xl bg-zinc-900/40 animate-pulse">
    <Bone className="w-28 h-28 md:w-48 md:h-48 rounded-full shrink-0" />
    <div className="space-y-3 flex-1">
      <Bone className="h-3 w-16" />
      <Bone className="h-8 w-48 md:w-72" />
      <Bone className="h-3 w-24" />
    </div>
  </div>
);

// ── Notification skeleton ──────────────────────
export const NotifSkeleton = ({ count = 5 }) => (
  <div className="flex flex-col gap-0">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="flex gap-3 px-4 py-3 border-b border-zinc-800/40 animate-pulse">
        <Bone className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Bone className="h-3 w-3/4" />
          <Bone className="h-2.5 w-1/2" />
          <Bone className="h-2 w-16" />
        </div>
      </div>
    ))}
  </div>
);

// ── Stats card skeleton ───────────────────────
export const StatsSkeleton = ({ count = 5 }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 md:p-5 animate-pulse">
        <Bone className="w-6 h-6 mb-3 rounded" />
        <Bone className="h-7 w-12 mb-2" />
        <Bone className="h-2.5 w-16" />
      </div>
    ))}
  </div>
);

// ── Playlist grid skeleton ─────────────────────
export const PlaylistSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array(6).fill(0).map((_, i) => (
      <div key={i} className="space-y-2 p-3 bg-zinc-900/40 rounded-2xl animate-pulse">
        <Bone className="aspect-square w-full rounded-xl" />
        <Bone className="h-3.5 w-3/4" />
        <Bone className="h-3 w-1/3" />
      </div>
    ))}
  </div>
);

// ── Chart skeleton ─────────────────────────────
export const ChartSkeleton = () => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 animate-pulse">
    <Bone className="h-4 w-32 mb-4" />
    <div className="flex items-end gap-3 h-40">
      {Array(8).fill(0).map((_, i) => (
        <Bone key={i} className="w-6 h-full rounded" />
      ))}
    </div>
  </div>
);

// ── Table skeleton ─────────────────────────────
export const TableSkeleton = ({ rows = 6 }) => (
  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 animate-pulse">
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-800/40">
        <Bone className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3 w-3/4" />
          <Bone className="h-2 w-1/2" />
        </div>
        <Bone className="h-3 w-12" />
      </div>
    ))}
  </div>
);

// ── Dashboard skeleton ─────────────────────────
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">

    <div className="flex items-center justify-between">
      <Bone className="h-7 w-40" />
      <Bone className="h-9 w-28 rounded-xl" />
    </div>

    <StatsSkeleton count={5} />

    <div className="grid md:grid-cols-2 gap-4">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    <TableSkeleton />

  </div>
);

// ── Profile skeleton ─────────────────────────

export const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className={`w-20 h-20 rounded-full bg-zinc-800 shrink-0 ${shimmer}`} />
      <div className="space-y-2 flex-1">
        <div className={`h-5 bg-zinc-800 rounded-full w-40 ${shimmer}`} />
        <div className={`h-3 bg-zinc-800 rounded-full w-24 ${shimmer}`} />
      </div>
    </div>
    <SongListSkeleton count={6} />
  </div>
);