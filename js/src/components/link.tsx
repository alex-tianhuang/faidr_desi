import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

export default function Link(props: {
  href: string;
  children: React.ReactNode;
  inline: boolean
}) {
  const { href, children, inline } = props;
  return (
    <a
      className={cn(buttonVariants({ variant: "link" }), inline && "h-auto p-0 inline")}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      children={children}
    />
  );
}
