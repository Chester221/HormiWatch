import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2, MapPin, Search, Plus, ChevronDown, Phone, Mail, User,
  Pencil, Trash2, Loader2, FileText, AlertTriangle,
  FolderKanban, Briefcase, Users, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientsWithContacts, useDeleteClient, type ClientWithContacts } from "@/hooks/useClientes";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const HORMI_BLUE = '#0DA2E7';

// 🔥 FUNCIONES AUXILIARES
const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function ClientCard({ client, expandedClients, toggleClient, handleEditClient, handleDeleteClick, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <Collapsible open={expandedClients.includes(client.id)} onOpenChange={() => toggleClient(client.id)}>
        <Card className="overflow-hidden border-border/50 bg-card transition-all duration-200 hover:shadow-md">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer transition-colors hover:bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden",
                    client.logo_url ? "bg-transparent" : "bg-[#0DA2E7]/10"
                  )}>
                    {client.logo_url ? (
                      <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Building2 className="h-5 w-5 text-[#0DA2E7]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold truncate">{client.name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {client.address && (
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </span>
                      )}
                      {client.ruc && (
                        <Badge variant="secondary" className="text-xs gap-1 h-5 px-1.5">
                          <FileText className="h-2.5 w-2.5" />
                          {client.ruc}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-xs text-muted-foreground mr-1">
                    {client.contacts.length} {client.contacts.length === 1 ? 'contacto' : 'contactos'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => handleEditClient(client, e)} 
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-[#0DA2E7]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => handleDeleteClick(client, e)} 
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <motion.div 
                    animate={{ rotate: expandedClients.includes(client.id) ? 180 : 0 }} 
                    transition={{ duration: 0.25 }}
                    className="text-muted-foreground ml-0.5"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <AnimatePresence>
            {expandedClients.includes(client.id) && (
              <CollapsibleContent asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <CardContent className="border-t border-border/50 pt-3 px-4 pb-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        Contactos
                      </h4>
                      {client.contacts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No hay contactos registrados</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {client.contacts.map((contact: any) => (
                            <div key={contact.id} className="rounded-lg bg-muted/20 p-2.5 transition-colors hover:bg-muted/40 border border-border/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-[#0DA2E7]/10 text-[#0DA2E7]">
                                    {contact.name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-xs font-medium truncate">{contact.name}</p>
                              </div>
                              <div className="flex flex-col gap-0.5 ml-8">
                                {contact.position && (
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="text-xs text-muted-foreground">{contact.position}</span>
                                  </div>
                                )}
                                {contact.email && (
                                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#0DA2E7] transition-colors">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                  </a>
                                )}
                                {contact.phone && (
                                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#0DA2E7] transition-colors">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    {contact.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>
    </motion.div>
  );
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClients, setExpandedClients] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithContacts | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; clientId: string; clientName: string }>({ open: false, clientId: '', clientName: '' });
  const [cannotDeleteDialog, setCannotDeleteDialog] = useState<{ open: boolean; clientName: string; projectCount: number }>({ open: false, clientName: '', projectCount: 0 });

  const { data: clients = [], isLoading, refetch } = useClientsWithContacts(searchQuery);
  const deleteClientMutation = useDeleteClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const totalContacts = clients.reduce((acc, c) => acc + c.contacts.length, 0);

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]);
  };

  const handleAddClient = () => { setEditingClient(null); setIsModalOpen(true); };
  const handleEditClient = (client: ClientWithContacts, e: React.MouseEvent) => { e.stopPropagation(); setEditingClient(client); setIsModalOpen(true); };
  
  const handleDeleteClick = async (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('client_id', client.id)
      .not('status', 'in', '("Completed","Cancelled")');
    
    if (projects && projects.length > 0) {
      setCannotDeleteDialog({ open: true, clientName: client.name, projectCount: projects.length });
    } else {
      setDeleteDialog({ open: true, clientId: client.id, clientName: client.name });
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', deleteDialog.clientId)
        .not('status', 'in', '("Completed","Cancelled")');
      
      if (projects && projects.length > 0) {
        toast.error(`No se puede eliminar: tiene ${projects.length} proyecto(s) activos`);
        setDeleteDialog({ open: false, clientId: '', clientName: '' });
        setIsDeleting(false);
        return;
      }

      const { error: contactsError } = await supabase.from('client_contacts').delete().eq('client_id', deleteDialog.clientId);
      if (contactsError) throw new Error(`Error al eliminar contactos: ${contactsError.message}`);

      const { error: clientError } = await supabase.from('clients').delete().eq('id', deleteDialog.clientId);
      if (clientError) throw new Error(`Error al eliminar cliente: ${clientError.message}`);

      toast.success(`"${deleteDialog.clientName}" eliminado`);
      setDeleteDialog({ open: false, clientId: '', clientName: '' });
      refetch();
    } catch (error: any) { 
      toast.error(error.message || 'Error al eliminar');
    }
    setIsDeleting(false);
  };

  const handleModalClose = (open: boolean) => { setIsModalOpen(open); if (!open) refetch(); };

  const leftClients = clients.filter((_, i) => i % 2 === 0);
  const rightClients = clients.filter((_, i) => i % 2 === 1);

  const cardProps = { expandedClients, toggleClient, handleEditClient, handleDeleteClick };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ═══════════ HEADER PREMIUM ═══════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card via-card to-[#0DA2E7]/3 p-6 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/20">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <span className="bg-gradient-to-r from-[#0DA2E7] to-[#0B8BC7] bg-clip-text text-transparent">
                    Clientes
                  </span>
                  <Badge className="bg-[#0DA2E7]/20 text-[#0DA2E7] border-none text-xs font-medium px-3 py-0.5 rounded-full">
                    {formatNumber(clients.length)} clientes
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  Gestiona tu directorio de clientes y contactos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleAddClient}
                className="gap-2 text-white shadow-md hover:shadow-lg transition-all bg-[#0DA2E7] hover:bg-[#0B8BC7]"
              >
                <Plus className="h-4 w-4" /> Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════ KPI CARDS ═══════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clientes</p>
                <p className="text-2xl font-bold text-foreground mt-1.5">{formatNumber(clients.length)}</p>
                <p className="text-xs text-muted-foreground mt-1">registrados</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110">
                <Building2 className="h-5 w-5 text-[#0DA2E7]" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contactos</p>
                <p className="text-2xl font-bold text-foreground mt-1.5">{formatNumber(totalContacts)}</p>
                <p className="text-xs text-muted-foreground mt-1">total registrados</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110">
                <Users className="h-5 w-5 text-[#0DA2E7]" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative overflow-hidden rounded-xl border border-[#0DA2E7]/10 bg-gradient-to-br from-[#0DA2E7]/5 to-transparent bg-card p-5 shadow-sm hover:shadow-lg hover:shadow-[#0DA2E7]/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#0DA2E7] opacity-[0.06] transition-transform duration-500 group-hover:scale-150" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proyectos</p>
                <p className="text-2xl font-bold text-foreground mt-1.5">0</p>
                <p className="text-xs text-muted-foreground mt-1">en total</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0DA2E7]/10 transition-transform duration-300 group-hover:scale-110">
                <FolderKanban className="h-5 w-5 text-[#0DA2E7]" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0DA2E7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        </div>

        {/* ═══════════ LISTA DE CLIENTES ═══════════ */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#0DA2E7]" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border bg-card">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Haz clic en "Nuevo Cliente" para agregar uno
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                {leftClients.map((client, index) => (
                  <ClientCard key={client.id} client={client} {...cardProps} index={index * 2} />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {rightClients.map((client, index) => (
                  <ClientCard key={client.id} client={client} {...cardProps} index={index * 2 + 1} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diálogo Eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 ring-4 ring-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">Eliminar Permanentemente</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4">
            <p className="text-sm text-foreground">¿Eliminar a <span className="font-semibold text-red-400">"{deleteDialog.clientName}"</span>?</p>
            <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">Se eliminarán todos los datos y contactos asociados.</p>
            </div>
          </div>
          <DialogFooter className="p-4 pt-0 gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, clientId: '', clientName: '' })} className="flex-1">Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="flex-1 font-medium">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo No se puede eliminar */}
      <Dialog open={cannotDeleteDialog.open} onOpenChange={(open) => setCannotDeleteDialog({ ...cannotDeleteDialog, open })}>
        <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 ring-4 ring-blue-500/10">
                <FolderKanban className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">No se puede eliminar</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">El cliente tiene proyectos en curso</p>
              </div>
            </div>
          </div>
          <div className="p-6 pt-4">
            <p className="text-sm text-foreground"><span className="font-semibold">"{cannotDeleteDialog.clientName}"</span> tiene <span className="font-semibold text-blue-400">{cannotDeleteDialog.projectCount} proyecto(s)</span> sin finalizar.</p>
            <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded-lg p-3">Debes completar o cancelar todos los proyectos del cliente antes de poder eliminarlo permanentemente.</p>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" onClick={() => setCannotDeleteDialog({ open: false, clientName: '', projectCount: 0 })} className="w-full">Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientFormModal open={isModalOpen} onOpenChange={handleModalClose} client={editingClient} />
    </DashboardLayout>
  );
}