import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(222, 47%, 11%)",
                foreground: "hsl(213, 31%, 91%)",
                primary: {
                    DEFAULT: "hsl(217, 91%, 60%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                secondary: {
                    DEFAULT: "hsl(222, 47%, 16%)",
                    foreground: "hsl(213, 31%, 91%)",
                },
                accent: {
                    DEFAULT: "hsl(142, 76%, 36%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                muted: {
                    DEFAULT: "hsl(223, 47%, 11%)",
                    foreground: "hsl(215, 20%, 65%)",
                },
                border: "hsl(215, 27%, 17%)",
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [],
};

export default config;
