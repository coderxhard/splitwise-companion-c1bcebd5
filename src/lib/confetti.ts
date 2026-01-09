import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  // Fire confetti from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Burst from center
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#22c55e', '#16a34a', '#15803d'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#22c55e', '#a3e635', '#4ade80'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#22c55e', '#10b981', '#34d399'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#fbbf24', '#f59e0b', '#22c55e'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#22c55e', '#84cc16', '#a3e635'],
  });
};

export const triggerSuccessConfetti = () => {
  // Smaller celebration for general success
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#10b981', '#34d399', '#4ade80'],
    zIndex: 9999,
  });
};
