import Icon from "./Icon";

export default function SearchInput({ placeholder = "Search jobs, companies…", ...props }) {
  return (
    <label className="search-input">
      <Icon name="search" size={16} />
      <input type="search" placeholder={placeholder} aria-label={placeholder} {...props} />
    </label>
  );
}