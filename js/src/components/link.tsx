import { buttonVariants } from "./ui/button";

export default function Link(props: {
  href: string;
  children: React.ReactNode;
}) {
  const { href, children } = props;
  return (
    <a
      className={buttonVariants({ variant: "link" })}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      children={children}
    />
  );
}
