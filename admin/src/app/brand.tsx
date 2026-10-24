/**
 * The app icon's mark (assets/images/icon_v3.svg without its green square): the star in `currentColor`, so it works
 * on the green header and on light pages, and its diamond in the brand's yellow.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-51 -51 102 102" aria-hidden="true" className={className} fill="currentColor" fillRule="evenodd">
      <path d="M0,-42.75L8.25,-51L30.75,-51L11.25,-31.5L31.5,-11.25L51,-30.75L51,-8.25L42.75,0L51,8.25L51,30.75L31.5,11.25L11.25,31.5L30.75,51L8.25,51L0,42.75L-8.25,51L-30.75,51L-11.25,31.5L-31.5,11.25L-51,30.75L-51,8.25L-42.75,0L-51,-8.25L-51,-30.75L-31.5,-11.25L-11.25,-31.5L-30.75,-51L-8.25,-51ZM0,-20.25L-20.25,0L0,20.25L20.25,0Z" />
      <rect x="-7.5" y="-7.5" width="15" height="15" transform="rotate(45)" fill="#E6BD5C" />
    </svg>
  );
}

/** Text in the brand face, uppercased like the app's "DAINORĖLIS" header logo. */
export function Wordmark({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-brand tracking-wide uppercase ${className}`}>{children}</span>;
}
