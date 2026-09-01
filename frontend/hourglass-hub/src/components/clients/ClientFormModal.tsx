import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, User, Loader2, Upload, X, Building2, ImageIcon, Sparkles, Pencil, CheckCircle, AlertCircle } from "lucide-react";
import { useSaveClientWithContacts, type ClientWithContacts } from "@/hooks/useClientes";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const HORMI_BLUE = '#0DA2E7';
const HORMI_GRADIENT = "linear-gradient(135deg, #0DA2E7 0%, #0B8BC7 100%)";

interface LocalContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
}

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientWithContacts | null;
}

const rifRegex = /^[JG]-\d{8}-\d$/;

const validateRif = (rif: string) => {
  if (!rif) return 'El RIF es obligatorio';
  if (!rifRegex.test(rif)) return 'Formato: J-12345678-9 o G-12345678-9';
  return null;
};

const validateEmail = (email: string) => {
  if (!email) return 'El email es obligatorio';
  if (!email.includes('@') || !email.includes('.', email.indexOf('@'))) return 'Email inválido';
  return null;
};

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const isEditing = !!client;
  const saveClientMutation = useSaveClientWithContacts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ name: "", rif: "", address: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({ name: client.name, rif: client.ruc || "", address: client.address || "" });
        setLogoPreview((client as any).logo_url || null);
        setContacts(client.contacts.map(c => ({
          id: c.id, name: c.name, email: c.email || "", phone: c.phone || "+58 ",
          position: c.position || "", department: (c as any).department || "",
        })));
      } else {
        setFormData({ name: "", rif: "", address: "" });
        setLogoPreview(null); setLogoFile(null); setContacts([]);
      }
      setTouched({});
    }
  }, [client, open]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (touched.name || formData.name) {
      if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
      else if (formData.name.trim().length < 2) errs.name = 'Mínimo 2 caracteres';
    }
    if (touched.rif || formData.rif) { const e = validateRif(formData.rif); if (e) errs.rif = e; }
    if (touched.address || formData.address) { if (!formData.address.trim()) errs.address = 'La dirección es obligatoria'; }
    contacts.forEach((c, i) => {
      if (touched[`contact_name_${i}`] || c.name) { if (!c.name.trim()) errs[`contact_name_${i}`] = 'Requerido'; }
      if (touched[`contact_position_${i}`] || c.position) { if (!c.position.trim()) errs[`contact_position_${i}`] = 'Requerido'; }
      if (touched[`contact_department_${i}`] || c.department) { if (!c.department.trim()) errs[`contact_department_${i}`] = 'Requerido'; }
      if (touched[`contact_email_${i}`] || c.email) { const e = validateEmail(c.email); if (e) errs[`contact_email_${i}`] = e; }
    });
    return errs;
  }, [formData, contacts, touched]);

  const isFormValid = useMemo(() => {
    if (!formData.name.trim() || formData.name.trim().length < 2) return false;
    if (!rifRegex.test(formData.rif)) return false;
    if (!formData.address.trim()) return false;
    const vc = contacts.filter(c => c.name.trim() !== "");
    if (vc.length === 0) return false;
    for (const c of vc) {
      if (!c.name.trim() || !c.position.trim() || !c.department.trim() || validateEmail(c.email)) return false;
    }
    return true;
  }, [formData, contacts]);

  const requiredFields = ['name', 'rif', 'address'];
  const filledFields = requiredFields.filter(f => {
    const val = formData[f as keyof typeof formData];
    return val !== undefined && val !== null && val !== '' && val !== 0;
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máx 2MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máx 2MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => { setLogoFile(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const uploadLogo = async (clientId: string): Promise<string | null> => {
    if (!logoFile) return logoPreview;
    setUploading(true);
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${clientId}.${fileExt}`;
    const { error } = await supabase.storage.from('logos').upload(fileName, logoFile, { upsert: true });
    if (error) { toast.error(`Error: ${error.message}`); setUploading(false); return null; }
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
    setUploading(false);
    return urlData.publicUrl;
  };

  const addContact = () => setContacts([...contacts, { id: `new-${Date.now()}`, name: "", email: "", phone: "+58 ", position: "", department: "" }]);
  const updateContact = (id: string, field: keyof LocalContact, value: string, index: number) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
    setTouched({ ...touched, [`contact_${field}_${index}`]: true });
  };
  const removeContact = (id: string) => setContacts(contacts.filter(c => c.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const validContacts = contacts.filter(c => c.name.trim() !== "");

    try {
      const result = await saveClientMutation.mutateAsync({
        client: { id: client?.id, name: formData.name, address: formData.address, ruc: formData.rif },
        contacts: validContacts.map(c => ({ name: c.name, email: c.email, phone: c.phone || undefined, position: c.position, department: c.department })),
        isEditing,
      });

      let clientId = client?.id;
      if (!clientId && result) {
        clientId = (result as any)?.clientId || (result as any)?.id || (result as any)?.[0]?.id;
      }

      if (clientId && logoFile) {
        const logoUrl = await uploadLogo(clientId);
        if (logoUrl) await supabase.from('clients').update({ logo_url: logoUrl }).eq('id', clientId);
      }

      toast.success(isEditing ? "Cliente actualizado" : "Cliente creado");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const formatRif = (value: string) => {
    let cleaned = value.toUpperCase().replace(/[^JG0-9-]/g, '');
    if (cleaned.length >= 2 && cleaned[1] !== '-') cleaned = cleaned[0] + '-' + cleaned.slice(1);
    if (cleaned.length >= 11 && cleaned[10] !== '-') cleaned = cleaned.slice(0, 10) + '-' + cleaned.slice(10);
    return cleaned.slice(0, 12);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col bg-card border-border p-0 rounded-2xl shadow-2xl">
        
        <div className="relative p-6 bg-gradient-to-r from-[#0DA2E7]/15 via-[#0DA2E7]/5 to-transparent border-b border-border flex-shrink-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0DA2E7]/5 blur-3xl" />
          
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0DA2E7] shadow-lg shadow-[#0DA2E7]/25">
                {isEditing ? <Pencil className="h-6 w-6 text-white" /> : <Building2 className="h-6 w-6 text-white" />}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3 flex-wrap">
                  {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0DA2E7]" />
                  {isEditing 
                    ? `Editando: ${client?.name}` 
                    : "Completa los datos del cliente"}
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {filledFields.length}/{requiredFields.length}
                </span>
                <div className="h-2 w-16 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ background: HORMI_GRADIENT }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(filledFields.length / requiredFields.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              {filledFields.length === requiredFields.length && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Datos básicos listos
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/10 border border-border/40 hover:border-[#0DA2E7]/20 transition-colors">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex-shrink-0",
                  isDragging ? 'ring-2 ring-[#0DA2E7] scale-105' : 'hover:ring-1 hover:ring-[#0DA2E7]/50',
                  logoPreview ? 'bg-white border border-border' : 'border-2 border-dashed border-border/60 bg-transparent'
                )}
              >
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1.5" />
                    <div
                      onClick={(e) => { e.stopPropagation(); removeLogo(); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                <p className="text-sm font-medium text-foreground">Logo de la empresa</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {logoPreview ? 'Haz clic para cambiar' : 'Clic o arrastra una imagen · PNG, JPG · Máx 2MB'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#0DA2E7]" />
                Información del Cliente
              </h3>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setTouched({ ...touched, name: true }); }}
                  placeholder="Nombre de la empresa"
                  className={cn(
                    "h-11 rounded-xl bg-muted/10 border-2 transition-all duration-200",
                    "focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-md focus:shadow-[#0DA2E7]/5",
                    errors.name ? "border-red-300 focus:border-red-500" : "border-border/60"
                  )}
                />
                {errors.name && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </motion.p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    RIF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.rif}
                    onChange={(e) => { setFormData({ ...formData, rif: formatRif(e.target.value) }); setTouched({ ...touched, rif: true }); }}
                    placeholder="J-12345678-9"
                    maxLength={12}
                    className={cn(
                      "h-11 rounded-xl bg-muted/10 border-2 transition-all duration-200",
                      "focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-md focus:shadow-[#0DA2E7]/5",
                      errors.rif ? "border-red-300 focus:border-red-500" : "border-border/60"
                    )}
                  />
                  {errors.rif ? (
                    <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.rif}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">J-12345678-9 (Jurídico) o G-12345678-9 (Gobierno)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    Dirección <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => { setFormData({ ...formData, address: e.target.value }); setTouched({ ...touched, address: true }); }}
                    placeholder="Ciudad, estado, país"
                    className={cn(
                      "h-11 rounded-xl bg-muted/10 border-2 transition-all duration-200",
                      "focus:border-[#0DA2E7]/50 focus:bg-white focus:shadow-md focus:shadow-[#0DA2E7]/5",
                      errors.address ? "border-red-300 focus:border-red-500" : "border-border/60"
                    )}
                  />
                  {errors.address && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.address}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-[#0DA2E7]" />
                  Contactos ({contacts.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContact}
                  className="gap-1.5 h-8 text-xs border-border/60 hover:border-[#0DA2E7]/30 hover:bg-[#0DA2E7]/5 transition-all rounded-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar contacto
                </Button>
              </div>

              <AnimatePresence>
                {contacts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 py-10 bg-muted/5"
                  >
                    <User className="h-10 w-10 text-muted-foreground/20 mb-2" />
                    <p className="text-sm text-muted-foreground">Sin contactos</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Agrega al menos un contacto</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-border/40 bg-muted/5 p-4 hover:border-[#0DA2E7]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0DA2E7]/10 text-[#0DA2E7] text-xs font-bold">
                              {index + 1}
                            </span>
                            Contacto
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(contact.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Nombre <span className="text-red-500">*</span></Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, "name", e.target.value, index)}
                              placeholder="Nombre completo"
                              className={cn(
                                "h-9 text-sm bg-card/50 border-border/60 rounded-lg",
                                errors[`contact_name_${index}`] && "border-red-300 focus:border-red-500"
                              )}
                            />
                            {errors[`contact_name_${index}`] && <p className="text-xs text-red-500">{errors[`contact_name_${index}`]}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Cargo <span className="text-red-500">*</span></Label>
                            <Input
                              value={contact.position}
                              onChange={(e) => updateContact(contact.id, "position", e.target.value, index)}
                              placeholder="Ej: Gerente General"
                              className={cn(
                                "h-9 text-sm bg-card/50 border-border/60 rounded-lg",
                                errors[`contact_position_${index}`] && "border-red-300 focus:border-red-500"
                              )}
                            />
                            {errors[`contact_position_${index}`] && <p className="text-xs text-red-500">{errors[`contact_position_${index}`]}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Departamento <span className="text-red-500">*</span></Label>
                            <Input
                              value={contact.department}
                              onChange={(e) => updateContact(contact.id, "department", e.target.value, index)}
                              placeholder="Ej: Ventas"
                              className={cn(
                                "h-9 text-sm bg-card/50 border-border/60 rounded-lg",
                                errors[`contact_department_${index}`] && "border-red-300 focus:border-red-500"
                              )}
                            />
                            {errors[`contact_department_${index}`] && <p className="text-xs text-red-500">{errors[`contact_department_${index}`]}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Email <span className="text-red-500">*</span></Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, "email", e.target.value, index)}
                              placeholder="contacto@empresa.com"
                              className={cn(
                                "h-9 text-sm bg-card/50 border-border/60 rounded-lg",
                                errors[`contact_email_${index}`] && "border-red-300 focus:border-red-500"
                              )}
                            />
                            {errors[`contact_email_${index}`] && <p className="text-xs text-red-500">{errors[`contact_email_${index}`]}</p>}
                          </div>
                          <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-sm font-medium">Teléfono <span className="text-muted-foreground/60">(Opcional)</span></Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, "phone", e.target.value, index)}
                              placeholder="+58 000-0000000"
                              className="h-9 text-sm bg-card/50 border-border/60 rounded-lg"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-6 pt-0 border-t border-border/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="default" 
                onClick={() => onOpenChange(false)} 
                disabled={saveClientMutation.isPending || uploading}
                className="flex-1 rounded-xl h-11 text-sm font-medium border-2 border-border/50 hover:border-[#0DA2E7]/30 hover:bg-[#0DA2E7]/5 transition-all"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                size="default" 
                disabled={!isFormValid || saveClientMutation.isPending || uploading}
                className="flex-1 rounded-xl h-11 gap-2 text-white font-medium shadow-md hover:shadow-lg transition-all"
                style={{ 
                  background: (isFormValid && !saveClientMutation.isPending && !uploading) ? HORMI_GRADIENT : "#94a3b8",
                  cursor: (isFormValid && !saveClientMutation.isPending && !uploading) ? 'pointer' : 'not-allowed'
                }}
              >
                {(saveClientMutation.isPending || uploading) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Guardando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    {isEditing ? <Pencil className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {isEditing ? "Guardar Cambios" : "Crear Cliente"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}