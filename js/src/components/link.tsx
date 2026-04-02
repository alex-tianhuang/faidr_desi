import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

export default function Link(props: {
  href: string;
  children: React.ReactNode;
  className?: string
}) {
  const { href, children, className } = props;
  return (
    <a
      className={cn(buttonVariants({ variant: "link" }), className)}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      children={children}
    />
  );
}
