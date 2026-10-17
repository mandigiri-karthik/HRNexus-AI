import { NavLink } from "react-router-dom";
import Icon from "./Icon";

export default function NavItem({ to, icon, label, count }) {
  return (
    <NavLink to={to} className="nav-item">
      <Icon name={icon} />
      <span className="nav-item__label">{label}</span>
      {count != null && <span className="nav-item__count">{count}</span>}
    </NavLink>
  );
}