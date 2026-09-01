import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CheckSquare, Clock, FolderKanban, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const tareasCount = tasks.length;
  const proyectosCount = projects.length;

  const horasTotal = tasks.reduce((acc, task) => {
    if (task.start_time && task.end_time) {
      const start = new Date(task.start_time).getTime();
      const end = new Date(task.end_time).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      return acc + hours;
    }
    return acc;
  }, 0);

  const tareasCompletadas = tasks.filter(t => t.status === 'Completed').length;
  const isLoading = isLoadingTasks || isLoadingProjects;

  // Funciones temporales para QuickActions (solo muestran un toast)
  const handleLogTime = () => toast.info("Log Time - Funcionalidad en desarrollo");
  const handleNewTask = () => toast.info("New Task - Funcionalidad en desarrollo");
  const handleNewProject = () => toast.info("New Project - Funcionalidad en desarrollo");
  const handleAddMember = () => toast.info("Add Member - Funcionalidad en desarrollo");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isLoading ? "Cargando..." : `¡Hola, ${userName}! 👋`}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aquí tienes un resumen de lo que está pasando con tus proyectos hoy.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Tareas Registradas" value={tareasCount} subtitle="Total en el sistema" icon={CheckSquare} trend={{ value: 12, positive: true }} delay={100} />
            <MetricCard title="Horas Registradas" value={`${horasTotal.toFixed(1)}h`} subtitle="Tiempo total invertido" icon={Clock} trend={{ value: 8, positive: true }} delay={150} />
            <MetricCard title="Proyectos" value={proyectosCount} subtitle="Total registrados" icon={FolderKanban} trend={{ value: 2, positive: true }} delay={200} />
            <MetricCard title="Tareas Completadas" value={tareasCompletadas} subtitle="Historial de éxito" icon={TrendingUp} trend={{ value: 5, positive: true }} delay={250} />
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <QuickActions
              onLogTime={handleLogTime}
              onNewTask={handleNewTask}
              onNewProject={handleNewProject}
              onAddMember={handleAddMember}
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;