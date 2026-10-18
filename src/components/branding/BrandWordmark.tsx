'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useBranding } from '@/lib/branding/brand-context'

interface BrandWordmarkProps {
  /**
   * Visual size. `'hero'` is for landing/auth/onboarding hero slots (~the
   * same vertical weight as the old 240px logo image). `'inline'` matches
   * the old 30px image used in top-left nav contexts.
   */
  size?: 'hero' | 'inline'
  /**
   * Force lowercase rendering. Defaults to true to match the existing
   * font-display + `.toLowerCase()` pattern used elsewhere in the app.
   */
  lowercase?: boolean
  className?: string
}

/**
 * Wordmark used in place of the legacy logo image on auth / onboarding /
 * sandbox / invite surfaces. On a branded host with an uploaded logo it
 * renders the logo image ALONE (founder call 2026-08-05: byrå logos usually
 * carry their own name, so logo + text read as a duplicate); otherwise it
 * renders exactly the text-only wordmark: the active brand's `appName` in
 * Hedvig Letters Serif at weight 700 (the display font is single-weight on
 * Google Fonts so 700 ends up synthetically bolded, but that matches the
 * requested aesthetic).
 */
export function BrandWordmark({
  size = 'hero',
  lowercase = true,
  className,
}: BrandWordmarkProps) {
  const branding = useBranding()
  const name = lowercase ? branding.appName.toLowerCase() : branding.appName

  // Zimla Kontor (no host brand): Zimla's dot mark beside the name in the app's sans,
  // the same signature as zimla.io. Byrå brands below keep their own serif wordmark.
  if (!branding.brand && !branding.logoUrl) {
    return (
      <span
        className={cn(
          'inline-flex items-center tracking-tight text-foreground',
          size === 'hero' ? 'gap-3 text-4xl md:text-[2.75rem]' : 'gap-2 text-base',
          className,
        )}
        style={{ fontWeight: 600 }}
      >
        <Image
          src={branding.logoPath}
          alt=""
          width={size === 'hero' ? 48 : 22}
          height={size === 'hero' ? 48 : 22}
          className={size === 'hero' ? 'h-12 w-12' : 'h-[22px] w-[22px]'}
          priority={size === 'hero'}
        />
        {branding.appName}
      </span>
    )
  }

  if (branding.logoUrl) {
    // The logo carries the brand alone; the app name moves into alt text so
    // the image keeps an accessible name.
    return (
      <span className={cn('inline-flex items-center', className)}>
        <Image
          src={branding.logoUrl}
          alt={name}
          width={size === 'hero' ? 214 : 88}
          height={size === 'hero' ? 64 : 22}
          className={cn('w-auto', size === 'hero' ? 'h-16' : 'h-[22px]')}
          priority={size === 'hero'}
          // Bypass the image optimizer: its remote-host allowlist is fixed at
          // build time, which the runtime-configured Docker image cannot
          // satisfy (issue #2203, same reasoning as BrandHomeLink).
          unoptimized
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'font-display tracking-tight inline-block',
        size === 'hero' ? 'text-5xl md:text-6xl' : 'text-base',
        className,
      )}
      style={{ fontWeight: 700 }}
    >
      {name}
    </span>
  )
}
