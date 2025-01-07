export default function easeOutSine(value: number, max: number): number {
  'worklet'; // reanimated works off the main thread, so we have to mark this as a worklet... I think
  const valueClamp = Math.min(Math.max(value, 0), max);
  const x = valueClamp / max; // mapping [0, value] to [0, 1]
  const xEase = Math.sin((x * Math.PI) / 2);
  return xEase;
}
