export function parseRngHint(rngHint: string, timestamp: number) {
  const rngHintParsed = Number.parseInt(rngHint);
  const usingTimestampForRng = Number.isNaN(rngHintParsed);
  const maxInt = 2 ** 32;
  if (usingTimestampForRng) {
    return {
      usingTimestampForRng: true as const,
      rngSeed: timestamp % maxInt,
    };
  }
  const overflow = rngHintParsed >= maxInt;
  const underflow = rngHintParsed < 0;
  const rngSeed = ((rngHintParsed % maxInt) + maxInt) % maxInt;
  return {
    usingTimestampForRng: false as const,
    rngSeed,
    overflow,
    underflow,
  };
}
