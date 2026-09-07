import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2, Clock, FolderKanban,
} from "lucide-react";

interface AllClientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: { name: string; hours: number; color: string; projectCount: number }[];
  onViewClient: (client: any) => void;
  totalClientHours: number;
  maxClientHours: number;
}

export default function AllClientsModal({
  open,
  onOpenChange,
  clients,
  onViewClient,
  totalClientHours,
  maxClientHours,
}: AllClientsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header fijo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="p-2.5 rounded-xl bg-muted"
              >
                <Building2 className="h-5 w-5 text-foreground" />
              </motion.div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Todos los Clientes
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {clients.length} {clients.length === 1 ? "cliente" : "clientes"} ·{" "}
                  {totalClientHours.toFixed(1)}h totales
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </motion.div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto pr-2 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
          >
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">No hay clientes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registra proyectos y tareas para ver clientes aquí
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clients.map((client, idx) => (
                  <motion.div
                    key={client.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + idx * 0.04, duration: 0.25 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card
                      className="hover:shadow-sm transition-shadow border-border overflow-hidden cursor-pointer bg-card"
                      onClick={() => {
                        onViewClient(client);
                        onOpenChange(false);
                      }}
                    >
                      <div
                        className="h-1 bg-primary"
                      />
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background bg-primary" />
                          <span className="text-sm font-semibold text-foreground truncate">
                            {client.name}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-1.5 mb-3">
                          <span className="text-3xl font-bold text-foreground tracking-tight">
                            {client.hours.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">horas</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 bg-primary"
                              style={{
                                width: `${(client.hours / maxClientHours) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {Math.round((client.hours / totalClientHours) * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {client.projectCount} {client.projectCount === 1 ? "proyecto" : "proyectos"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round((client.hours / totalClientHours) * 100)}% del total
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}