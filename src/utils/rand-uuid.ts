export const uuid = (count: number = 8): string => {
  return Array.from({ length: count }, () => {
    const r = (Math.random() * 36) | 0;
    return r.toString(36);
  }).join('');
};
