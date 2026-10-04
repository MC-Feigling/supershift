<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <section class="hidden border-r border-ink bg-ink px-12 py-14 text-paper lg:flex lg:flex-col lg:justify-between">
      <AppMark on-dark />
      <div class="border-t border-paper/20 pt-8">
        <p class="max-w-md text-5xl font-medium leading-none tracking-tight">Dein Plan. Eine Person dazu.</p>
        <p class="mt-5 max-w-sm text-base leading-7 text-paper/70">
          Schichten sind Namen. Du setzt sie auf Tage, auch jede Woche bis zu einem Datum, und druckst Woche oder Monat.
        </p>
      </div>
      <p class="border-t border-paper/20 pt-4 text-xs uppercase tracking-[0.16em] text-paper/60">Nur du änderst den Plan. Die andere Person liest mit.</p>
    </section>
    <section class="flex min-h-screen flex-col justify-start bg-paper px-5 pb-16 pt-10 sm:px-10 lg:justify-center lg:py-12">
      <div class="mb-8 lg:hidden">
        <AppMark />
      </div>
      <div class="mx-auto w-full max-w-md border border-line bg-card p-6 sm:p-8">
        <slot />
      </div>
    </section>
  </div>
</template>
