import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.ADMIN_EMAIL;
const senha = process.env.ADMIN_SENHA;
const nome = process.env.ADMIN_NOME ?? "Admin";
const clinicaId = process.env.ADMIN_CLINICA_ID ?? "clinica-001";

if (!url || !secret || !email || !senha) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, ADMIN_EMAIL e ADMIN_SENHA.");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
  app_metadata: { papel: "admin", clinica_id: clinicaId },
});

if (error || !data.user) {
  console.error(error?.message ?? "Não foi possível criar o admin");
  process.exit(1);
}

const { error: erroLinha } = await admin.from("usuarios").insert({
  id: data.user.id,
  nome,
  email: email.toLowerCase(),
  papel: "admin",
  clinica_id: clinicaId,
  ativo: true,
});

if (erroLinha) {
  console.error(erroLinha.message);
  process.exit(1);
}

console.log(`Admin criado: ${email}`);
