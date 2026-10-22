/**
 * The app icon's white mark (assets/images/icon.svg without its green square),
 * drawn in `currentColor` so it works on the green header and on light pages.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="37 37 151 151" aria-hidden="true" className={className} fill="currentColor" fillRule="evenodd">
      <path d="M44.663,37.125l135.674,0c4.161,0 7.538,3.377 7.538,7.538l-0,135.674c-0,4.161 -3.377,7.538 -7.538,7.538l-135.674,0c-4.161,0 -7.538,-3.377 -7.538,-7.538l-0,-135.674c-0,-4.161 3.377,-7.538 7.538,-7.538Zm9.124,128.616l-0,5.472l8.759,0l82.699,-118.22l-12.587,0l-10.558,15.093l-10.568,-15.093l-12.592,0l16.867,24.089l-11.831,16.912l-28.709,-41.001l-12.591,0l35.008,49.997l-43.897,62.751Zm26.912,5.472l12.588,0l8.516,-12.174l8.525,12.174l12.591,0l-14.823,-21.17l12.465,-17.819l27.3,38.989l12.592,0l-33.599,-47.984l45.153,-64.547l-0,-5.689l-8.609,0l-82.699,118.22Zm91.308,-8.723l-0,-17.983l-15.192,-21.695l15.192,-21.717l-0,-17.994l-27.781,39.713l27.781,39.676Zm-118.22,-98.863l-0,17.983l15.519,22.164l-15.519,22.185l-0,17.994l28.108,-40.181l-0.002,-0.001l0.002,-0.002l-28.108,-40.142Z" />
    </svg>
  );
}

/** "DAINORĖLIS" in the brand face, uppercased like the app's header logo. */
export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-brand tracking-wide uppercase ${className}`}>Dainorėlis</span>;
}
