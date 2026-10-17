import Icon from "./Icon";

// variant: "primary" (one main action per view), "secondary" (alternatives), "ghost" (low emphasis)
export default function Button({ variant = "primary", icon, type = "button", className = "", children, ...props }) {
  return (
    <button type={type} className={`button button--${variant} ${className}`.trim()} {...props}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}