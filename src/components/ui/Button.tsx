import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export default function Button({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-mono uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-[11px]',
        size === 'md' && 'px-4 py-2 text-xs',
        variant === 'primary' && 'bg-neon text-black hover:brightness-110',
        variant === 'ghost'   && 'bg-transparent border border-line text-ink hover:border-neon hover:text-neon',
        variant === 'danger'  && 'bg-transparent border border-red text-red hover:bg-red hover:text-black',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
