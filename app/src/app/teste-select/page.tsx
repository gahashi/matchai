"use client";

import { useState } from "react";
import {
    AsyncSelect,
    AsyncSelectOption,
} from "@/components/ui/AsyncSelect";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TesteSelectPage() {
    const [usuario, setUsuario] = useState<AsyncSelectOption | null>(null);
    const [usuarios, setUsuarios] = useState<AsyncSelectOption[]>([]);

    return (
        <AppShell>
            <PageHeader
                title="Teste de AsyncSelect"
                subtitle="Componente estilo Select2 com modo single e multiple."
            />

            <div className="bp-grid" style={{ gap: 20 }}>
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Single select</h2>
                        <p className="bp-section-subtitle">
                            Quando mode não é informado, o padrão é single.
                        </p>

                        <div style={{ maxWidth: 520, marginTop: 18 }}>
                            <AsyncSelect
                                label="Usuário"
                                placeholder="Digite nome, email ou nickname..."
                                endpoint="/api/sys/usuarios/select"
                                value={usuario}
                                onChange={setUsuario}
                            />

                            <pre
                                style={{
                                    marginTop: 18,
                                    padding: 16,
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--color-surface)",
                                    color: "var(--color-text-muted)",
                                    overflowX: "auto",
                                }}
                            >
                                {JSON.stringify(usuario, null, 2)}
                            </pre>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">Multiple select</h2>
                        <p className="bp-section-subtitle">
                            Usado para escolher vários usuários, diretores,
                            colaboradores ou cursos.
                        </p>

                        <div style={{ maxWidth: 520, marginTop: 18 }}>
                            <AsyncSelect
                                mode="multiple"
                                label="Usuários"
                                placeholder="Digite nome, email ou nickname..."
                                endpoint="/api/sys/usuarios/select"
                                value={usuarios}
                                onChange={setUsuarios}
                                maxSelected={5}
                            />

                            <pre
                                style={{
                                    marginTop: 18,
                                    padding: 16,
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--color-surface)",
                                    color: "var(--color-text-muted)",
                                    overflowX: "auto",
                                }}
                            >
                                {JSON.stringify(usuarios, null, 2)}
                            </pre>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </AppShell>
    );
}