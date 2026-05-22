import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import Link from "./link";

export function NormalError(props: { title: string; message: string }) {
  const { title, message } = props;
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

const MY_EMAIL = "tianh.huang@mail.utoronto.ca";
export function UnexpectedError(props: { error: string; while: string }) {
  const { while: _while, error } = props;
  return (
    <Alert variant="destructive">
      <AlertTitle className="pb-2">{"We're sorry! An internal error occurred."}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col gap-2 w-full">
          <span>
            Something we didn't account for went wrong while {_while}.
          </span>
          <span>
            We take privacy seriously, and do not perform any automated error
            collection. In order to improve the software, we rely on people to
            submit reports.
          </span>
          <span>
            It would help us a lot if you could copy the underlined error below and report
            it to{" "}
            <Link href={`mailto:${MY_EMAIL}`} inline={true}>
              {MY_EMAIL}
            </Link>
            .
          </span>
          <span className="underline">{error}</span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
