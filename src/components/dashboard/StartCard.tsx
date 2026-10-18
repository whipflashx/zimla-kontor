'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StartCardName } from './startkort-assets'

// Zimla Kontor: the start card is a quiet zinc panel in the app's own tokens (no
// painted image, no scrim), the same calm surface as zimla.io. `card`, `layout` and
// `floatIcons` stay in the props so every caller keeps compiling; they only steer
// the text alignment now.

interface StartCardAction {
  label: string
  href?: string
  onClick?: () => void
}

interface StartCardProps {
  card: StartCardName
  /** 'side-right': image on the right half. 'bleed-left': full-bleed image,
   *  text over a scrim on the left. 'center': full-bleed, centered text. */
  layout: 'side-right' | 'bleed-left' | 'center'
  title: string
  body: string
  eyebrow?: string
  primary: StartCardAction
  secondary?: StartCardAction
  /** Floating channel badges over the right half (Underlag). */
  floatIcons?: boolean
  /** Tighter type for narrow containers (the inbox preview pane). */
  dense?: boolean
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}

function ActionButton({ action, kind }: { action: StartCardAction; kind: 'primary' | 'secondary' }) {
  const variant = kind === 'primary' ? 'default' : 'outline'
  if (action.href) {
    return (
      <Button asChild variant={variant}>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    )
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  )
}

export function StartCard({
  layout,
  title,
  body,
  eyebrow,
  primary,
  secondary,
  dense = false,
  onDismiss,
  dismissLabel,
  className,
}: StartCardProps) {
  const center = layout === 'center'
  return (
    <div
      className={cn(
        'relative flex flex-col justify-center rounded-lg border border-border bg-muted/50',
        dense ? 'px-6 py-5' : 'px-7 py-7',
        center && 'items-center text-center',
        className,
      )}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="absolute right-3 top-3 p-1 text-muted-foreground/60 transition-colors duration-150 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className={cn('flex max-w-xl flex-col', center ? 'items-center' : 'items-start')}>
        {eyebrow && (
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h2
          className={cn(
            'text-balance font-medium tracking-tight text-foreground',
            dense ? 'text-lg leading-snug' : 'text-xl leading-tight',
          )}
        >
          {title}
        </h2>
        <p className="mb-4 mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
        <div className={cn('flex flex-wrap gap-2', center && 'justify-center')}>
          <ActionButton action={primary} kind="primary" />
          {secondary && <ActionButton action={secondary} kind="secondary" />}
        </div>
      </div>
    </div>
  )
}
