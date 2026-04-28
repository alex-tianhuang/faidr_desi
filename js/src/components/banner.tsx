import { ThemeToggle } from "./themeToggle";

export default function Banner() {
  return (
    <div className="sticky w-full top-0 px-5 pt-3 pb-2 shadow border-b text-center font-extrabold text-3xl underline bg-background z-50">
      FAIDR-desi
      <div className="fixed top-2 right-4">
        <ThemeToggle></ThemeToggle>
      </div>
    </div>
  );
}
