import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, email, data } = await req.json();

    // Inicializar Supabase
    const supabaseClient = createClient(
      Deno.env.get("PROJECT_URL") ?? "",
Deno.env.get("SERVICE_ROLE_KEY") ?? "",
Deno.env.get("RESEND_API_KEY") ?? "",
    );

    // Inicializar Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    let subject = "";
    let html = "";

    switch (type) {
      case "task_reminder":
        subject = "🔔 Recordatorio de Tarea - HormiWatch";
        html = `
          <h2>Recordatorio de Tarea</h2>
          <p>Tienes tareas pendientes que requieren tu atención:</p>
          <p><strong>${data?.description || "Sin descripción"}</strong></p>
          <p>Proyecto: ${data?.project || "N/A"}</p>
          <p>Estado: ${data?.status || "Pendiente"}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">HormiWatch - Sistema de Gestión de Horas</p>
        `;
        break;

      case "weekly_summary":
        subject = "📊 Resumen Semanal - HormiWatch";
        html = `
          <h2>Resumen Semanal</h2>
          <p>Aquí está tu resumen de la semana:</p>
          <ul>
            <li>📋 Tareas completadas: <strong>${data?.completedTasks || 0}</strong></li>
            <li>⏱ Horas trabajadas: <strong>${data?.totalHours || 0}h</strong></li>
            <li>💰 Ingresos generados: <strong>$${data?.totalRevenue || 0}</strong></li>
            <li>📁 Proyectos activos: <strong>${data?.activeProjects || 0}</strong></li>
          </ul>
          <hr>
          <p style="color: #666; font-size: 12px;">HormiWatch - Sistema de Gestión de Horas</p>
        `;
        break;

      default:
        throw new Error("Tipo de email no válido");
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "HormiWatch <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, emailData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});