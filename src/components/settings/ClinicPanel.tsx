import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ClinicInput, getClinic, updateClinic } from "../../lib/clinic";
import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useCan } from "../../contexts/AuthContext";

export function ClinicPanel() {
    const queryClient = useQueryClient();
    const can = useCan();
    const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic });

    const [form, setForm] = useState<ClinicInput>({ name: '', cnpj: '' });

    useEffect(() => {
        if (clinic) {
            setForm({
                name: clinic.name,
                cnpj: clinic.cnpj,
                cro: clinic.cro ?? '',
                phone: clinic.phone ?? '',
                email: clinic.email ?? '',
                address: clinic.address ?? '',
            });
        }
    }, [clinic]);

    const updateMutation = useMutation({
        mutationFn: updateClinic,
        onSuccess: (updated) => queryClient.setQueryData(['clinic'], updated),
    });

    return (
        <Card>
            <h3 className="mb-4 font-sans text-base font-semibold text-text-primary">Dados da Clínica</h3>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Nome da clínica" value={form.name} disabled={!can.operate} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="CNPJ" value={form.cnpj} disabled={!can.operate} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                <Input label="CRO" value={form.cro} disabled={!can.operate} onChange={(e) => setForm({ ...form, cro: e.target.value })} />
                <Input label="Telefone" value={form.phone} disabled={!can.operate} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input label="E-mail" value={form.email} disabled={!can.operate} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input label="Endereço" value={form.address} disabled={!can.operate} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="mt-4 flex justify-end">
                <Button onClick={() => updateMutation.mutate(form)} disabled={!can.manage_clinic || updateMutation.isPending}>
                    Salvar alterações
                </Button>
            </div>
        </Card>
    )
}