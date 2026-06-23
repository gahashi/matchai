import { CreditCard, Home, Settings, Shield } from "lucide-react";

export function MobileBottomNav() {
    return (
        <nav className="bp-mobile-nav">
            <a href="/" className="active">
                <Home size={17} />
                Início
            </a>
            <a href="/atletica">
                <Shield size={17} />
                Atlética
            </a>
            <a href="#">
                <CreditCard size={17} />
                Planos
            </a>
            <a href="/tema">
                <Settings size={17} />
                Tema
            </a>
        </nav>
    );
}