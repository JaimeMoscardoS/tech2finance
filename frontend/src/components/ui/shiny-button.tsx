import type { ButtonHTMLAttributes } from 'react';
import './shiny-button.css';

export function ShinyButton({ className = '', type = 'button', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
 return <button type={type} className={`shiny-button ${className}`} {...props}><span className="shiny-button__content">{children}</span></button>;
}
