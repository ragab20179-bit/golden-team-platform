import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NEOChatProvider } from "./contexts/NEOChatContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import ITSolutions from "./pages/ITSolutions";
import AstraPM from "./pages/AstraPM";
import Consultancy from "./pages/Consultancy";
import About from "./pages/About";
import Contact from "./pages/Contact";
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
import MeetingModule from "./pages/MeetingModule";
import NEOCore from "./pages/NEOCore";
import AuthorityMatrix from "./pages/AuthorityMatrix";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RolesPermissions from "./pages/admin/RolesPermissions";
import SystemSettings from "./pages/admin/SystemSettings";
import PlatformHealth from "./pages/admin/PlatformHealth";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import ModuleAccess from "./pages/admin/ModuleAccess";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
      <Route path="/portal/governance/authority-matrix" component={AuthorityMatrix} />
      <Route path="/portal/meetings" component={MeetingModule} />
      <Route path="/portal/neo-core" component={NEOCore} />
      <Route path="/neo-architecture" component={NEOArchitecture} />
      <Route path="/architecture" component={Architecture} />
      <Route path="/project-plan" component={ProjectPlan} />
      <Route path="/it-solutions" component={ITSolutions} />
      <Route path="/astra-pm" component={AstraPM} />
      <Route path="/consultancy" component={Consultancy} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/roles" component={RolesPermissions} />
      <Route path="/admin/settings" component={SystemSettings} />
      <Route path="/admin/health" component={PlatformHealth} />
      <Route path="/admin/audit" component={AdminAuditLog} />
      <Route path="/admin/modules" component={ModuleAccess} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <NEOChatProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </NEOChatProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
