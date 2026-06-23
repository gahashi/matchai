import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/Button";

async function loginDev() {
    "use server";

    (await cookies()).set("bp_auth_dev", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
    });

    redirect("/");
}

export default function LoginPage() {
    return (
        <main className="bp-status-page">
            <section className="bp-status-card">
                <div className="bp-status-logo-wrap">
                    <img
                        src="/brand/brava-pass-symbol-dark.png"
                        alt="Brava Pass"
                        className="bp-status-logo"
                    />
                </div>

                <span className="bp-status-code">Login</span>

                <h1>Entrar no Brava Pass</h1>

                <p>
                    Login temporário para desenvolvimento. Depois vamos trocar
                    por autenticação real com email e senha.
                </p>

                <form action={loginDev} className="bp-status-actions">
                    <Button type="submit">
                        Entrar como Admin Dev
                    </Button>
                </form>
            </section>
        </main>
    );
}