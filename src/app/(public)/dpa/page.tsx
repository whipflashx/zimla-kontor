import type { Metadata } from 'next'
import { SourceCodeFooter } from '@/components/branding/SourceCodeFooter'
import { getBranding } from '@/lib/branding/service'

export function generateMetadata(): Metadata {
  return {
    title: `Personuppgiftsbiträdesavtal - ${getBranding().appName}`,
  }
}

/**
 * Zimla Kontor: biträdesavtalet tecknas med Zimla AB per företag. Grundversionens avtalstext beskrev en
 * annan leverantörs drift och underbiträden och är borttagen; den egna avtalstexten publiceras här.
 */
export default function DPAPage() {
  const { appName, legalEntity, supportEmail } = getBranding()
  return (
    <div className="min-h-dvh bg-background py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <h1 className="font-display text-3xl tracking-tight text-foreground">Personuppgiftsbiträdesavtal</h1>
        <p className="text-sm text-muted-foreground">
          Biträdesavtalet för {appName} tecknas med {legalEntity}. Kontakta{' '}
          <a href={`mailto:${supportEmail}`} className="underline underline-offset-2">{supportEmail}</a>{' '}
          för avtalet.
        </p>
        <p className="text-sm text-muted-foreground">
          Så behandlar {legalEntity} personuppgifter:{' '}
          <a href="https://zimla.io/integritetspolicy/" className="underline underline-offset-2">integritetspolicyn</a>.
        </p>
        <SourceCodeFooter className="pt-4" />
      </div>
    </div>
  )
}
