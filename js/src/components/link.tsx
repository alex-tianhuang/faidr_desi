import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

export default function Link(props: {
  href: string;
  children: React.ReactNode;
  inline: boolean;
  className?: string;
}) {
  const { href, children, inline, className } = props;
  return (
    <a
      className={cn(buttonVariants({ variant: "link" }), inline && "h-auto p-0 inline", className)}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      children={children}
    />
  );
}
