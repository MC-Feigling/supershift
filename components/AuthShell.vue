<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <section class="auth-hatch relative hidden overflow-hidden px-12 py-14 text-ink lg:flex lg:flex-col lg:justify-between">
      <div class="absolute left-0 top-0 h-full w-1.5 bg-spruce" />
      <div class="pointer-events-none absolute inset-8 border border-spruce/40">
        <span class="absolute -left-1 -top-1 h-2 w-2 bg-spruce" />
        <span class="absolute -right-1 -top-1 h-2 w-2 bg-spruce" />
        <span class="absolute -bottom-1 -left-1 h-2 w-2 bg-spruce" />
        <span class="absolute -bottom-1 -right-1 h-2 w-2 bg-spruce" />
      </div>
      <AppMark on-dark />
      <div class="relative">
        <p class="label-meta">Persönlicher Schichtplan</p>
        <p class="display-title mt-4 max-w-lg text-5xl leading-[1.08] text-ink">
          Dein Plan.<br>Eine Person dazu.
        </p>
        <p class="mt-5 max-w-sm text-lg leading-8 text-muted">
          Schichten sind Namen. Du setzt sie auf Tage, auch jede Woche bis zu einem Datum. Die andere Person liest mit und kann sich benachrichtigen lassen.
        </p>
      </div>
      <p class="relative font-mono text-xs uppercase tracking-stencil text-muted">Nur du änderst den Plan. Die andere Person liest mit.</p>
    </section>
    <section class="flex min-h-screen flex-col justify-start border-l border-line bg-sand px-5 pb-16 pt-10 sm:px-10 lg:justify-center lg:py-12">
      <div class="mb-8 lg:hidden">
        <AppMark />
      </div>
      <div class="mx-auto w-full max-w-md">
        <slot />
      </div>
    </section>
  </div>
</template>
