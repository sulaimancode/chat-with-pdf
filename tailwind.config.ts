import { type Config } from "tailwindcss";
import {
  blackA,
  mauve,
  violet,
  slateDark,
  indigoDark,
  cyanDark,
  gray,
  blue,
  sky,
} from "@radix-ui/colors";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: () => ({
        "custom-gradient-dark": `linear-gradient(180deg, rgba(26, 29, 30, 0), #1a1d1e 55%)`,
        "custom-gradient": `linear-gradient(180deg, rgba(248, 248, 248, 0), #f8f8f8 55%)`,
      }),
      colors: {
        ...blackA,
        ...mauve,
        ...violet,
        ...slateDark,
        ...indigoDark,
        ...cyanDark,
        ...gray,
        ...blue,
        ...sky,
      },
    },
  },
  plugins: [],
} satisfies Config;
