  import { motion } from "framer-motion";
  import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

  interface MetricCardMGProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
      value: number;
      positive: boolean;
    };
    className?: string;
    delay?: number;
  }

  export function MetricCardMG({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    className,
    delay = 0 
  }: MetricCardMGProps) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay / 1000, duration: 0.3 }}
        className="group relative overflow-hidden rounded-xl border border-border/40 bg-white dark:bg-card shadow-sm hover:shadow-lg hover:border-[#0DA2E7]/40 transition-all duration-300"
      >
        {/* Círculo decorativo de fondo */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
        
        <div className="relative flex items-start justify-between p-5">
          {/* Lado izquierdo: título, valor, subtítulo y trend */}
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1.5">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-medium ${
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.positive ? "+" : ""}{trend.value}%
              </div>
            )}
          </div>

          {/* Lado derecho: icono con fondo más transparente */}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/[0.08] transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
            <Icon className="h-5 w-5 text-[#0DA2E7]" />
          </div>
        </div>
      </motion.div>
    );
  }