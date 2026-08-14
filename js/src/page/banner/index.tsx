import ThemeToggle from "./themeToggle";

export default function Banner() {
  return (
    <div className="flex flex-col sticky w-full top-0 px-5 pt-3 pb-2 shadow border-b bg-background gap-2 z-50 border-foreground">
      <div className="text-center font-black text-4xl underline font-serif">
        FAIDR-Desi
        <div className="absolute top-2.5 right-4">
          <ThemeToggle/>
        </div>
      </div>
      <div className="text-center text-sm text-muted-foreground font-semibold">
        <span className="underline">F</span>eature{" "}
        <span className="underline">A</span>nalysis of{" "}
        <span className="underline">I</span>ntrinsically{" "}
        <span className="underline">D</span>isordered{" "}
        <span className="underline">R</span>egions{" "}
        <span className="underline">Desi</span>gn Tool
      </div>
    </div>
  );
}
