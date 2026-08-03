import { AppLayout } from "../components/layout/AppLayout";
import { PayersPanel } from "../components/settings/PayersPanel";

export default function PayersAdmin() {
    return (
        <AppLayout title="Convênios" subtitle="Operadoras vinculadas à sua clínica">
            <PayersPanel />
        </AppLayout>
    );
}