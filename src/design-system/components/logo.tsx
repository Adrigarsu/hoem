// The HØEM wordmark, from docs/design-system/assets/logos/hoem-wordmark.svg. The paths are inline
// and painted with currentColor, so one component follows both themes and the brand panel, where
// the SVG files have their colours fixed.
const tones = {
  default: { letters: "text-text", slashedO: "text-brand" },
  // On a brand background the Ø uses brand-tint (5.3:1), never a module colour.
  "on-brand": { letters: "text-on-brand", slashedO: "text-brand-tint" },
};

type LogoProps = {
  // "HØEM", from the messages file.
  label: string;
  tone?: keyof typeof tones;
  className?: string;
};

export function Logo({ label, tone = "default", className = "h-6" }: LogoProps) {
  const { letters, slashedO } = tones[tone];
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 3198 840"
      className={`w-auto shrink-0 self-start ${className}`}
    >
      <g className={letters}>
        <path fill="currentColor" d="M468 770V497H198V770H0V70H198V333H468V70H666V770Z" />
        <path fill="currentColor" d="M1692 770V70H2241V223H1888V341H2199V489H1888V617H2254V770Z" />
        <path
          fill="currentColor"
          d="M2384 770V70H2547L2793 474L3033 70H3196L3198 770H3016L3014 399L2834 701H2746L2567 409V770Z"
        />
      </g>
      <path
        fill="currentColor"
        className={slashedO}
        d="M1179 784Q1110 784 1049 766L1009 840H893L956 724Q926 705 901 680Q848 631 819 565Q790 499 790 420Q790 341 819 275Q848 209 900.5 159.5Q953 110 1024 83Q1095 56 1179 56Q1249 56 1310 74L1350 0H1466L1402 117Q1432 136 1457 159Q1509 209 1538.5 275Q1568 341 1568 420Q1568 499 1538.5 565.5Q1509 632 1457 681Q1405 730 1334.5 757Q1264 784 1179 784ZM1043 564 1227 226Q1204 220 1179 220Q1139 220 1104.5 234Q1070 248 1044.5 274.5Q1019 301 1004.5 337.5Q990 374 990 420Q990 465 1005 502Q1019 538 1043 564ZM1179 620Q1219 620 1253.5 606Q1288 592 1313.5 565.5Q1339 539 1353.5 502Q1368 465 1368 420Q1368 374 1354 337Q1340 302 1316 277L1132 615Q1154 620 1179 620Z"
      />
    </svg>
  );
}
