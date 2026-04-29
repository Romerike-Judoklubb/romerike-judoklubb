import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { navn, epost, melding } = await req.json();

    if (!navn || !epost || !melding) {
      return new Response(
        JSON.stringify({ error: "Alle felt må fylles ut." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kontaktskjema <post@romerikejudoklubb.no>",
        to: ["kontakt@romerikejudoklubb.no"],
        reply_to: epost,
        subject: `Ny henvendelse fra ${navn}`,
        html: `
          <p><strong>Navn:</strong> ${navn}</p>
          <p><strong>E-post:</strong> <a href="mailto:${epost}">${epost}</a></p>
          <p><strong>Melding:</strong></p>
          <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#444">
            ${melding.replace(/\n/g, "<br/>")}
          </blockquote>
          <hr/>
          <p style="color:#888;font-size:0.85em">Sendt via kontaktskjemaet på romerikejudoklubb.no</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      console.error("Resend error:", detail);
      throw new Error("Email delivery failed");
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
