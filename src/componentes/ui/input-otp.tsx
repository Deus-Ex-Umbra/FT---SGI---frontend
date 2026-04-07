import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput> & { containerClassName?: string }
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSeparator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children = ":", ...props }, ref) => (
  <span
    ref={ref}
    className={cn("px-1 text-sm font-semibold text-slate-500 dark:text-slate-400", className)}
    {...props}
  >
    {children}
  </span>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext?.slots?.[index];

  if (!slot) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium tabular-nums text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium tabular-nums text-slate-900 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        slot.isActive &&
          "z-10 ring-2 ring-slate-950 ring-offset-2 ring-offset-white dark:ring-slate-300 dark:ring-offset-slate-950",
        className,
      )}
      {...props}
    >
      {slot.char}
      {slot.hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px bg-slate-900 dark:bg-slate-100" />
        </div>
      ) : null}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
