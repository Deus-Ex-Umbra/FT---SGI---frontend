import * as React from 'react';
import { cn } from '@/utilidades/ui';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            type="checkbox"
            className={cn(
                'h-4 w-4 rounded border border-slate-300 bg-white accent-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:accent-slate-100 dark:focus-visible:ring-slate-300',
                className,
            )}
            {...props}
        />
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
