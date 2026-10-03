interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Spendly mark: a rounded coin-square in emerald with a bold "S" drawn as a
 * growing sprout — the S's top terminal sprouts two leaves. Finance + growth,
 * no dollar sign.
 */
export default function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Spendly logo"
    >
      <defs>
        <linearGradient id="spendly-g" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#spendly-g)" />
      <rect x="2" y="2" width="44" height="44" rx="13" fill="black" fillOpacity="0" />
      {/* S letterform */}
      <path
        d="M31.5 16.5c-3.5-2.6-10.5-2.3-11 2.4-.5 5.4 8.5 4.7 8.2 10.2-.3 5.7-8 6.2-12 3.6"
        stroke="white"
        strokeWidth="5.4"
        strokeLinecap="round"
      />
      {/* Sprout leaves growing from the top of the S */}
      <path
        d="M32 15.5c1.5-4.5 5-6.5 9.5-6.5-.5 4.5-4 7-9.5 6.5Z"
        fill="#d1fae5"
      />
      <path
        d="M31 16.5c-3.5-2.5-4.5-6-3.5-10 4 1 5.5 5 3.5 10Z"
        fill="#a7f3d0"
      />
    </svg>
  );
}
