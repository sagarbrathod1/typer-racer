import Image from "next/image";
import { Inter } from "next/font/google";
import ToggleButton from "@/components/ToggleButton/ToggleButton";
import Head from "next/head";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { AngelIcon, DevilIcon } from "@/assets/images";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { theme } = useTheme();

  const tabIcon: string = useMemo(
    () => (theme === "light" ? AngelIcon.src : DevilIcon.src),
    [theme]
  );

  return (
    <>
      <Head>
        <title>Typer Racer</title>
        <link rel="icon" href={tabIcon} />
      </Head>
      <>
        <ToggleButton />
      </>
    </>
  );
}
