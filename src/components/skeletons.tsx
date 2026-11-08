import type { ReactNode } from "react";

/** A grey placeholder block; `className` sets its size. */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-zinc-800 ${className}`} />;
}

/**
 * The busy region a route shows while its server render is in flight. It pulses only when motion is allowed,
 * and screen readers hear "Loading…".
 */
function LoadingRegion({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={`motion-safe:animate-pulse ${className}`}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

/** A TitleCard's footprint: a 2:3 poster, a title line and a year line. */
function CardSkeleton() {
  return (
    <li data-testid="card-skeleton">
      <Bar className="aspect-[2/3] w-full rounded-md" />
      <Bar className="mt-2 h-[1.1875rem] w-3/4" />
      <Bar className="mt-1 h-4 w-1/3" />
    </li>
  );
}

/** TitleGrid's columns, holding one TMDB page (20 results). */
function GridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 20 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </ul>
  );
}

/** The h1 and the Movies / TV switch that open browse and search. */
function HeadingAndSwitch() {
  return (
    <>
      <Bar className="h-8 w-48" />
      <Bar className="h-[2.125rem] w-[8.5rem] rounded-md" />
    </>
  );
}

export function BrowseSkeleton() {
  return (
    <LoadingRegion className="space-y-6">
      <HeadingAndSwitch />
      <div aria-hidden="true" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }, (_, index) => (
            <Bar key={index} className="h-6 w-20 rounded-full" />
          ))}
        </div>
        <Bar className="h-6 w-72 rounded-full" />
      </div>
      <GridSkeleton />
    </LoadingRegion>
  );
}

export function SearchSkeleton() {
  return (
    <LoadingRegion className="space-y-6">
      <HeadingAndSwitch />
      <div className="space-y-4">
        <Bar className="h-5 w-40" />
        <GridSkeleton />
      </div>
    </LoadingRegion>
  );
}

/** DetailsLayout's grid: the poster column, then a heading, an action, synopsis lines and facts. */
function DetailsSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div aria-hidden="true" className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
      <Bar className="mx-auto aspect-[2/3] w-40 rounded-md sm:w-full" />
      <div className="min-w-0 space-y-5">
        <div className="space-y-3">
          <Bar className="h-9 w-2/3" />
          {action && <Bar className="h-9 w-28 rounded-md" />}
        </div>
        <div className="space-y-2">
          <Bar className="h-5 w-full" />
          <Bar className="h-5 w-full" />
          <Bar className="h-5 w-4/5" />
        </div>
        <div className="space-y-2">
          {["w-1/3", "w-1/4", "w-1/2", "w-1/4", "w-2/5", "w-3/4"].map((width, index) => (
            <Bar key={index} className={`h-5 ${width}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TitleSkeleton() {
  return (
    <LoadingRegion>
      <DetailsSkeleton />
    </LoadingRegion>
  );
}

/** The show details, then the season picker and a few episodes. */
export function ShowSkeleton() {
  return (
    <LoadingRegion className="space-y-10">
      <DetailsSkeleton />
      <div aria-hidden="true" className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Bar key={index} className="h-[3.25rem] w-24 rounded-md" />
          ))}
        </div>
        <div className="space-y-4">
          <Bar className="h-7 w-32" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Bar className="aspect-video w-full max-w-[185px] shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-6 w-1/2" />
                <Bar className="h-5 w-1/3" />
                <Bar className="h-5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/** The profile column and facts, then a biography and the first career rows. */
export function PersonSkeleton() {
  return (
    <LoadingRegion>
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8">
        <Bar className="mx-auto aspect-[2/3] w-40 rounded-md sm:w-full" />
        <div className="min-w-0 space-y-5">
          <div className="space-y-3">
            <Bar className="h-9 w-1/2" />
            <div className="space-y-2">
              {["w-1/3", "w-1/2", "w-2/5"].map((width, index) => (
                <Bar key={index} className={`h-5 ${width}`} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Bar className="h-7 w-28" />
            <Bar className="h-5 w-full" />
            <Bar className="h-5 w-full" />
            <Bar className="h-5 w-3/4" />
          </div>
          <div className="space-y-4">
            <Bar className="h-7 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Bar className="h-4 w-16 shrink-0" />
                  <Bar className="size-3 shrink-0 rounded-full" />
                  <Bar className="h-[3.75rem] w-10 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Bar className="h-5 w-1/2" />
                    <Bar className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}
