import { redirect } from 'next/navigation'

/**
 * Zimla Kontor: integritetspolicyn är Zimla AB:s och ligger på zimla.io, inte här. Sidan fanns kvar
 * från grundversionen med en annan leverantörs infrastruktur och underbiträden; länkar till /privacy
 * (inloggning, registrering, sidfötter) leder nu dit.
 */
export default function PrivacyPage(): never {
  redirect('https://zimla.io/integritetspolicy/')
}
