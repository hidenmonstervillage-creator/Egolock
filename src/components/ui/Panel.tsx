import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  accent?: 'neon' | 'red'
  children: React.ReactNode
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ title, accent, children, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-panel border border-line p-4',
          accent === 'neon' && 'border-l-2 border-l-neon',
          accent === 'red'  && 'border-l-2 border-l-red',
          className,
        )}
        {...rest}
      >
        {title && (
          <div className="label text-dim mb-3">{title}</div>
        )}
        {children}
      </div>
    )
  },
)

Panel.displayName = 'Panel'
export default Panel
