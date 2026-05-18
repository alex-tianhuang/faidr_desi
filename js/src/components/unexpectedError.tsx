import Link from "./link";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const MY_EMAIL = "tianh.huang@mail.utoronto.ca";
export default function UnexpectedError(props: {
  error: string;
  while: string;
}) {
  const { while: _while, error } = props;
  return (
    <Alert variant="destructive">
      <AlertTitle>{"We're sorry! An internal error occurred."}</AlertTitle>
      <AlertDescription>
        Something we didn't account for went wrong while {_while}.
        <br />
        We take privacy seriously, and do not perform any automated error
        collection. In order to improve the software, we rely on people to
        submit reports.
        <br />
        It would help us a lot if you could copy the error below and report it
        to{" "}
        <Link href={`mailto:${MY_EMAIL}`} inline={true}>
          {MY_EMAIL}
        </Link>
        .<br />
        <span className="underline">Error: {error}</span>
      </AlertDescription>
    </Alert>
  );
}
