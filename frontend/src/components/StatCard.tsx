import React from "react";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color?: "brand" | "success" | "warning" | "danger";
};

export default function StatCard({ title, value, icon, trend, color = "brand" }: StatCardProps) {
  const colors = {
    brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
    success: "text-success-400 bg-success-500/10 border-success-500/20",
    warning: "text-warning-400 bg-warning-500/10 border-warning-500/20",
    danger: "text-danger-400 bg-danger-500/10 border-danger-500/20",
  };

  return (
    <div className={`glass p-6 rounded-xl border ${colors[color].split(" ")[2]} card-hover relative overflow-hidden flex flex-col justify-between`}>
      {/* Decorative gradient blur */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${colors[color].split(" ")[1]}`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-zinc-400 font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-lg ${colors[color].split(" ")[1]} ${colors[color].split(" ")[0]}`}>
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {trend && (
          <div className="text-xs text-zinc-500">
            <span className="text-success-400 font-medium">{trend}</span> since last week
          </div>
        )}
      </div>
    </div>
  );
}
