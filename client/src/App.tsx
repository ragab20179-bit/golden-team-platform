import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Portal from "./pages/Portal";
import NEOArchitecture from "./pages/NEOArchitecture";
import Architecture from "./pages/Architecture";
import ProjectPlan from "./pages/ProjectPlan";
import HRModule from "./pages/HRModule";
import ERPModule from "./pages/ERPModule";
import CRMModule from "./pages/CRMModule";
import KPIModule from "./pages/KPIModule";
import ProcurementModule from "./pages/ProcurementModule";
import QMSModule from "./pages/QMSModule";
import LegalModule from "./pages/LegalModule";
import CommsModule from "./pages/CommsModule";
import AuditModule from "./pages/AuditModule";
import GovernanceModule from "./pages/GovernanceModule";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/portal" component={Portal} />
      <Route path="/portal/hr" component={HRModule} />
      <Route path="/portal/erp" component={ERPModule} />
      <Route path="/portal/crm" component={CRMModule} />
      <Route path="/portal/kpi" component={KPIModule} />
      <Route path="/portal/procurement" component={ProcurementModule} />
      <Route path="/portal/qms" component={QMSModule} />
      <Route path="/portal/legal" component={LegalModule} />
      <Route path="/portal/comms" component={CommsModule} />
      <Route path="/portal/audit" component={AuditModule} />
      <Route path="/portal/governance" component={GovernanceModule} />
      <Route path="/neo-architecture" component={NEOArchitecture} />
      <Route path="/architecture" component={Architecture} />
      <Route path="/project-plan" component={ProjectPlan} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
