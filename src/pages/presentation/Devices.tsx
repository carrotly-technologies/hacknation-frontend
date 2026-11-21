import type { ReactNode } from 'react'
import s from '../PresentationPage.module.css'

/** Laptop drawn in CSS: lid with a bezel, a 16:9 screen with a real screenshot, and the base. */
export function Laptop({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`${s.laptop} ${className ?? ''}`}>
      <div className={s.laptopLid}>
        <img className={s.laptopScreen} src={src} alt={alt} width={2560} height={1440} decoding="async" />
      </div>
      <div className={s.laptopBase} aria-hidden="true" />
    </figure>
  )
}

/** Phone drawn in CSS: rounded body, a notch and a 390×844 screenshot. */
export function Phone({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <figure className={`${s.phone} ${className ?? ''}`}>
      <img className={s.phoneScreen} src={src} alt={alt} width={780} height={1688} decoding="async" />
      <span className={s.phoneNotch} aria-hidden="true" />
    </figure>
  )
}

/** A cut-out of a screen as a floating card (used where a whole laptop would make the detail too small). */
export function Panel({ src, alt, width, height, className, children }: { src: string; alt: string; width: number; height: number; className?: string; children?: ReactNode }) {
  return (
    <figure className={`${s.panel} ${className ?? ''}`}>
      <img src={src} alt={alt} width={width} height={height} decoding="async" />
      {children}
    </figure>
  )
}
