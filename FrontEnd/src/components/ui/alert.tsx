import * as React from "react";
import { cn } from "cn";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="alert" className={cn("relative w-full rounded-lg border px-3 py-2 text-sm", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm leading-5", className)} {...props} />;
}

export { Alert, AlertDescription };
