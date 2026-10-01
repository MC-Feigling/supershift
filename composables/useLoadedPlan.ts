export async function useLoadedPlan() {
  const plan = usePlanStore()
  await useAsyncData('plan', async () => {
    await plan.load()
    return plan.status
  })
  return plan
}
