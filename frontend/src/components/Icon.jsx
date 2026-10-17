import {
  ArrowUp, Banknote, Bell, Briefcase, Building2, Check, ChevronDown, Clock, Ellipsis,
  ExternalLink, FileText, Filter, Inbox, MapPin, MessageSquare, Paperclip, Pencil, Plus,
  Search, SlidersHorizontal, Sparkles, SquareKanban, Upload, User, X,
} from "lucide-react";

// The Figma icon set (icon/<name>), mapped to Lucide. 20px, 1.75 stroke, as in the design system.
const ICONS = {
  message: MessageSquare,
  briefcase: Briefcase,
  inbox: Inbox,
  kanban: SquareKanban,
  user: User,
  sliders: SlidersHorizontal,
  search: Search,
  filter: Filter,
  paperclip: Paperclip,
  "arrow-up": ArrowUp,
  sparkle: Sparkles,
  check: Check,
  x: X,
  pencil: Pencil,
  "map-pin": MapPin,
  banknote: Banknote,
  clock: Clock,
  "file-text": FileText,
  "external-link": ExternalLink,
  more: Ellipsis,
  upload: Upload,
  bell: Bell,
  "chevron-down": ChevronDown,
  building: Building2,
  plus: Plus,
};

export default function Icon({ name, size = 20, ...props }) {
  const LucideIcon = ICONS[name];
  return <LucideIcon size={size} strokeWidth={1.75} aria-hidden="true" {...props} />;
}