import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'outline'
  shadowSize?: 'none' | 'sm' | 'md'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  shadowSize = 'md',
  className = '',
  ...props
}) => {
  const cardClass = `card card-${variant} ${shadowSize !== 'none' ? `card-shadow-${shadowSize}` : ''} ${className}`

  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  )
}
