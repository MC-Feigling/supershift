<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <section class="auth-hatch relative hidden overflow-hidden px-12 py-14 text-ink lg:flex lg:flex-col lg:justify-between">
      <div class="absolute left-0 top-0 h-full w-1.5 bg-spruce" />
      <AppMark on-dark />
      <div>
        <p class="label-meta">Persönlicher Schichtplan</p>
        <p class="mt-4 max-w-md font-display text-5xl font-medium uppercase leading-tight tracking-wide text-ink">
          Dein Plan. Eine Person dazu.
        </p>
        <p class="mt-5 max-w-sm text-lg leading-8 text-muted">
          Schichten sind Namen. Du setzt sie auf Tage, auch jede Woche bis zu einem Datum, und druckst Woche oder Monat.
        </p>
      </div>
      <p class="font-mono text-xs uppercase tracking-stencil text-muted">Nur du änderst den Plan. Die andere Person liest mit.</p>
    </section>
    <section class="flex min-h-screen flex-col justify-start border-l border-line bg-paper px-5 pb-16 pt-10 sm:px-10 lg:justify-center lg:py-12">
      <div class="mb-8 lg:hidden">
        <AppMark />
      </div>
      <div class="mx-auto w-full max-w-md">
        <slot />
      </div>
    </section>
  </div>
</template>
