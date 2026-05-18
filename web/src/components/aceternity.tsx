import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

/* === Light Studio — signature visuals === */

export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      {/* Soft film grain dots */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(28,25,23,0.05) 1px, transparent 0)",
          backgroundSize: '14px 14px',
        }}
      />
      {/* Lens flare */}
      <div
        className="absolute -right-32 -top-16 size-[28rem] rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(circle, rgba(190,24,93,0.18), rgba(190,24,93,0.04) 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute -left-24 bottom-0 size-[22rem] rounded-full opacity-25"
        style={{
          background:
            'radial-gradient(circle, rgba(180,83,9,0.15), rgba(180,83,9,0.03) 40%, transparent 70%)',
        }}
      />
    </div>
  )
}

export function MovingBorder({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl studio-card', className)}>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-0.5"
        style={{ background: 'linear-gradient(to right, transparent, var(--color-rose), transparent)' }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function SpotlightHero({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <section className={cn('relative overflow-hidden rounded-3xl studio-card', className)}>
      {/* Aperture motif */}
      <motion.div
        aria-hidden
        className="absolute right-6 top-6 grid size-14 place-items-center rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-white"
        style={{
          background:
            'conic-gradient(from 0deg, #be185d, #9d174d 30%, #1c1917 60%, #be185d 100%)',
          boxShadow: '0 6px 18px -8px rgba(190, 24, 93, 0.6), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        <span style={{ transform: 'rotate(-180deg)' }} className="font-light">f/2.8</span>
      </motion.div>
      <div className="relative pr-20">{children}</div>
    </section>
  )
}

/** Polaroid frame for image previews. */
export function Polaroid({
  caption,
  tilt = 'l',
  children,
  className,
}: {
  caption?: string
  tilt?: 'l' | 'r' | 'none'
  children: React.ReactNode
  className?: string
}) {
  return (
    <figure
      className={cn(
        'polaroid',
        tilt === 'l' ? 'polaroid--tilt-l' : tilt === 'r' ? 'polaroid--tilt-r' : '',
        className,
      )}
    >
      {children}
      {caption ? (
        <figcaption className="mt-2 text-center text-xs italic text-[var(--color-warm-ink-soft)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
