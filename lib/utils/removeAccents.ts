export default function removeAccents(value: string) {
  return value
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ė/g, 'e')
    .replace(/ę/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z');
}
