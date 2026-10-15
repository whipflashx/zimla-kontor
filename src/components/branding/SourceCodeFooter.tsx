import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * Discreet source-code footer line (WL-06 slice A6).
 *
 * AGPL-3.0 section 13 compliance: the running service must offer its source
 * to everyone who interacts with it over the network, so this renders on BOTH
 * default and branded hosts; never gate it on a brand. Zimla Kontor: /kallkod är
 * källkodsarkivet för exakt den version som körs (läggs ut av deploy-skriptet, serveras av Nginx). Dual-use component: works as a server component (privacy/dpa) and
 * inside client pages (login); next-intl supports useTranslations in both.
 */

const SOURCE_REPO_URL = '/kallkod'

export function SourceCodeFooter({ className }: { className?: string }) {
  const t = useTranslations('common')
  return (
    <p className={cn('text-center text-xs text-muted-foreground', className)}>
      <a
        href={SOURCE_REPO_URL}
        download
        className="underline underline-offset-2 hover:text-foreground transition-colors"
      >
        {t('source_code')}
      </a>
    </p>
  )
}
