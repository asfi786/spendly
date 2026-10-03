import {
  Briefcase,
  CarFront,
  Clapperboard,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Plane,
  ReceiptText,
  Shapes,
  ShoppingBag,
  Store,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>> = {
  UtensilsCrossed,
  CarFront,
  ShoppingBag,
  ReceiptText,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  Shapes,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
};

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
}

/** Rounded tinted tile with the category's lucide icon. */
export default function CategoryIcon({ icon, color, size = 20 }: CategoryIconProps) {
  const Icon = ICONS[icon] ?? Shapes;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size + 22,
        height: size + 22,
        backgroundColor: `${color}1a`,
        color,
      }}
      aria-hidden
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
