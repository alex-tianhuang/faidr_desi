import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export default function ErrorDiv(props: { title: string; message: string }) {
  const { title, message } = props;
  return <Alert>
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>;
}
