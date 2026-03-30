import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export type Mutation = {
  from: string;
  to: string;
  pos: number;
};
export function mutationToString(mutation: Mutation) {
  const { from, to, pos } = mutation;
  return `${from}${pos + 1}${to}`;
}
