<template>
  <div class="min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
    <section class="relative hidden overflow-hidden bg-spruce px-12 py-14 text-paper lg:flex lg:flex-col lg:justify-between">
      <AppMark on-dark />
      <div>
        <p class="max-w-md font-display text-5xl font-medium leading-tight text-white">Dein Plan. Eine Person dazu.</p>
        <p class="mt-5 max-w-sm text-lg leading-8 text-white/80">
          Schichten sind Namen. Du setzt sie auf Tage, auch jede Woche bis zu einem Datum, und druckst Woche oder Monat.
        </p>
      </div>
      <p class="text-sm text-white/70">Nur du änderst den Plan. Die andere Person liest mit.</p>
    </section>
    <section class="flex min-h-screen flex-col justify-start px-5 pb-16 pt-10 sm:px-10 lg:justify-center lg:py-12">
      <div class="mb-8 lg:hidden">
        <AppMark />
      </div>
      <div class="mx-auto w-full max-w-md">
        <slot />
      </div>
    </section>
  </div>
</template>
