interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function YieldFlowLogo({ size = 32, className = '', style = {} }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <defs>
        {/* Left Arm Teal Gradient */}
        <linearGradient id="yfTealGrad" x1="10" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dd4a8" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>

        {/* Right Arm Emerald Gradient */}
        <linearGradient id="yfGreenGrad" x1="90" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Upward Arrow Dark Navy */}
        <linearGradient id="yfArrowGrad" x1="30" y1="90" x2="70" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Left arm of Y */}
      <path
        d="M 22 18 C 30 18, 42 35, 48 58 L 48 88 C 44 88, 42 84, 42 78 L 42 55 C 36 38, 26 24, 18 20 Z"
        fill="url(#yfTealGrad)"
      />

      {/* Right arm of Y */}
      <path
        d="M 78 18 C 70 18, 58 35, 52 58 L 52 88 C 56 88, 58 84, 58 78 L 58 55 C 64 38, 74 24, 82 20 Z"
        fill="url(#yfGreenGrad)"
      />

      {/* Center stem weave */}
      <path
        d="M 44 48 C 48 40, 52 40, 56 48 L 56 80 C 56 84, 44 84, 44 80 Z"
        fill="#14b8a6"
        opacity="0.9"
      />

      {/* Upward Curved Arrow at Bottom Stem */}
      <path
        d="M 42 86 C 42 68, 56 60, 68 56 L 64 50 L 78 56 L 68 68 L 66 62 C 56 65, 48 72, 48 86 Z"
        fill="#0f2b3c"
        stroke="#2dd4a8"
        strokeWidth="1.5"
      />
    </svg>
  );
}
