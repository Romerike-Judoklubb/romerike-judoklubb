import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("SITE_ORIGIN") ?? "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { navn, epost, telefon } = await req.json();

    if (!navn || !epost || !telefon) {
      return new Response(
        JSON.stringify({ error: "Alle felt må fylles ut." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("signups")
      .insert({ navn, epost, telefon });

    if (dbError) {
      if (dbError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Denne e-postadressen er allerede registrert." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw dbError;
    }

    const resendBase = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
    };

    // Email 1: Confirmation
    const confirmRes = await fetch("https://api.resend.com/emails", {
      ...resendBase,
      body: JSON.stringify({
        from: "Romerike Judoklubb <kontakt@romerikejudoklubb.no>",
        to: [epost],
        subject: "Påmelding mottatt – Romerike Judoklubb",
        html: `
          <p>Hei ${navn},</p>
          <p>Vi har mottatt din påmelding til 14 dagers gratis prøveperiode!</p>
          <p>En av oss tar kontakt med deg snart for å avtale din første trening.</p>
          <p>Har du spørsmål i mellomtiden? Ta gjerne kontakt på
          <a href="mailto:kontakt@romerikejudoklubb.no">kontakt@romerikejudoklubb.no</a>
          eller ring oss på <a href="tel:+4792043361">920 43 361</a>
          (mandag–fredag kl. 12:00–17:00).</p>
          <p>Vi gleder oss til å se deg på matta!</p>
          <p>– Romerike Judoklubb</p>
        `,
      }),
    });

    if (!confirmRes.ok) {
      console.error("Confirmation email error:", await confirmRes.text());
    }

    // Email 2: First class info (placeholder – edit content before going live)
    const firstClassRes = await fetch("https://api.resend.com/emails", {
      ...resendBase,
      body: JSON.stringify({
        from: "Romerike Judoklubb <kontakt@romerikejudoklubb.no>",
        to: [epost],
        subject: "Alt du trenger å vite til din første trening",
        html: `
          <p>Hei ${navn},</p>

          <p>[REDIGER: Legg til velkomstmelding fra trenerne her]</p>

          <h2>Praktisk informasjon</h2>
          <p>[REDIGER: Hva bør de ta med? Hva skal de ha på seg? Hvem skal de spørre etter?]</p>

          <h2>Treningssted</h2>
          <p>Åråsveien 16A, 2007 Kjeller</p>

          <h2>Timeplan</h2>
          <ul>
            <li><strong>Mandag:</strong> Kamptrening 19:00–20:30</li>
            <li><strong>Tirsdag:</strong> Barn (7+) 17:30–18:30 · Ungdom (11+) 18:30–19:30 · Voksne (16+) 19:30–21:00</li>
            <li><strong>Onsdag:</strong> Knøttejudo (4+) 17:30–18:15</li>
            <li><strong>Torsdag:</strong> Barn (7+) 17:30–18:30 · Ungdom (11+) 18:30–19:30 · Voksne (16+) 19:30–21:00</li>
            <li><strong>Lørdag:</strong> Åpen matte / kamptrening 10:00–12:00</li>
          </ul>

          <p>[REDIGER: Avslutt med en oppmuntrende setning]</p>

          <p>– Romerike Judoklubb<br/>
          📞 920 43 361<br/>
          ✉️ kontakt@romerikejudoklubb.no</p>
        `,
      }),
    });

    if (!firstClassRes.ok) {
      console.error("First class email error:", await firstClassRes.text());
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Noe gikk galt. Prøv igjen senere." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
