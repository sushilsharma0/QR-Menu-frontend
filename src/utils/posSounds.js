function playTone(freq, duration = 0.12, volume = 0.08) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = volume
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    setTimeout(() => {
      o.stop()
      ctx.close()
    }, duration * 1000)
  } catch {
    /* ignore */
  }
}

export const posSounds = {
  newOrder: () => playTone(880, 0.15, 0.06),
  paymentOk: () => {
    playTone(523, 0.1, 0.07)
    setTimeout(() => playTone(784, 0.12, 0.07), 90)
  },
  kitchenReady: () => playTone(660, 0.2, 0.07),
}
