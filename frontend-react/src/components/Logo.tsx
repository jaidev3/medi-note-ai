import { SVGProps } from "react";

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width={200}
    height={200}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="MediNote AI Logo"
    {...props}
  >
    <circle cx={100} cy={100} r={90} fill="#EDF6F9" />
    <rect x={85} y={50} width={30} height={100} fill="#0077B6" rx={5} />
    <rect x={50} y={85} width={100} height={30} fill="#0096C7" rx={5} />
    <circle cx={115} cy={65} r={6} fill="#00B4D8" />
    <circle cx={85} cy={135} r={6} fill="#00B4D8" />
    <circle cx={135} cy={115} r={6} fill="#48CAE4" />
    <text
      x={100}
      y={185}
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      fontSize={24}
      fill="#03045E"
      fontWeight="bold"
      textAnchor="middle"
    >
      {"MediNote AI"}
    </text>
  </svg>
);

export default Logo;
