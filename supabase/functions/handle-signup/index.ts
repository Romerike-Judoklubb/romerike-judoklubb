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

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Romerike Judoklubb <post@romerikejudoklubb.no>",
        to: [epost],
        subject: "Velkommen til Romerike Judoklubb – prøvetid bekreftet!",
        html: `
          <p>Hei ${navn},</p>
          <p>Takk for at du meldte deg på 14 dagers gratis prøvetid!</p>
          <p>En av trenerne våre tar kontakt med deg på <strong>${telefon}</strong> for å avtale første trening.</p>
          <p>Du kan også møte opp direkte på en av treningene våre:</p>
          <ul>
            <li><strong>Tirsdag:</strong> Barn (7+) 17:30, Ungdom (11+) 18:30, Fokus bakkekamp (16+) 19:30</li>
            <li><strong>Torsdag:</strong> Barn (7+) 17:30, Ungdom (11+) 18:30, Kast (16+) 19:30</li>
            <li><strong>Lørdag:</strong> Kamptrening / Egentrening 10:00</li>
          </ul>
          <p><strong>Adresse:</strong> Åråsveien 16A, 2007 Kjeller</p>
          <p>Vi gleder oss til å se deg på matta!</p>
          <p>– Romerike Judoklubb<br/>
          📞 +47 920 43 361<br/>
          ✉️ post@romerikejudoklubb.no</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      console.error("Resend error:", await resendRes.text());
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
