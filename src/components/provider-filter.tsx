import Image from "next/image";
import { browseHref, toggleId, type BrowseState } from "@/lib/catalog/browse-params";
import type { Provider } from "@/lib/catalog/providers";
import { Pill } from "./browse-controls";

const JUSTWATCH_URL = "https://www.justwatch.com/";

/** The logo's rendered size in CSS pixels; the image is TMDB's w92 logo, scaled down for sharp high-DPI pills. */
const LOGO_PX = 20;

interface ProviderFilterProps {
  /** The region's top 12 services for the kind, in TMDB's display order, from `listProviders` (server-only). */
  providers: Provider[];
  state: BrowseState;
}

function ProviderLogo({ provider }: { provider: Provider }) {
  if (!provider.logoUrl) {
    // Keeps the pill's height and layout; the name beside it already says which service it is.
    return <span aria-hidden className="inline-block rounded bg-zinc-800" style={{ width: LOGO_PX, height: LOGO_PX }} />;
  }
  return (
    <Image src={provider.logoUrl} alt={provider.name} width={LOGO_PX} height={LOGO_PX} unoptimized className="rounded" />
  );
}

/**
 * Service pills toggle a service in the selection, and "Any service" clears it; a title must stream on at least one.
 * Any change starts again from page 1 and keeps the kind, genres, sort and an explicit region. TMDB's terms require
 * crediting JustWatch for provider data, so the credit is part of the filter and shown wherever it is.
 * A region that lists no services renders nothing.
 */
export function ProviderFilter({ providers, state }: ProviderFilterProps) {
  if (providers.length === 0) return null;
  return (
    <div className="space-y-2">
      <nav aria-label="Streaming service">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Pill href={browseHref({ ...state, providers: [], page: 1 })} active={state.providers.length === 0}>
              Any service
            </Pill>
          </li>
          {providers.map((provider) => (
            <li key={provider.id}>
              <Pill
                href={browseHref({ ...state, providers: toggleId(state.providers, provider.id), page: 1 })}
                active={state.providers.includes(provider.id)}
                // The logo's alt is the name too, so the link names the service once.
                label={provider.name}
              >
                <ProviderLogo provider={provider} />
                {provider.name}
              </Pill>
            </li>
          ))}
        </ul>
      </nav>
      <p className="text-xs text-zinc-400">
        <a
          href={JUSTWATCH_URL}
          className="underline hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Streaming data by JustWatch
        </a>
      </p>
    </div>
  );
}
