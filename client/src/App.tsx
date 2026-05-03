import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NEOChatProvider } from "./contexts/NEOChatContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Page-level loading fallback ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col gap-4 p-8">
      <Skeleton className="h-12 w-48 rounded-lg" />
      <Skeleton className="h-6 w-96 rounded" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl mt-2" />
    </div>
  );
}

// ─── Public pages ─────────────────────────────────────────────────────────────
const Home             = lazy(() => import("./pages/public/Home"));
const Login            = lazy(() => import("./pages/public/Login"));
const ITSolutions      = lazy(() => import("./pages/public/ITSolutions"));
const AstraPM          = lazy(() => import("./pages/public/AstraPM"));
const Consultancy      = lazy(() => import("./pages/public/Consultancy"));
const About            = lazy(() => import("./pages/public/About"));
const Contact          = lazy(() => import("./pages/public/Contact"));
const NEOArchitecture  = lazy(() => import("./pages/public/NEOArchitecture"));
const Architecture     = lazy(() => import("./pages/public/Architecture"));
const ProjectPlan      = lazy(() => import("./pages/public/ProjectPlan"));
const NotFound         = lazy(() => import("./pages/public/NotFound"));
const ComponentShowcase = lazy(() => import("./pages/public/ComponentShowcase"));

// ─── Construction pages ───────────────────────────────────────────────────────
const Construction     = lazy(() => import("./pages/construction/Construction"));
const KDPProject       = lazy(() => import("./pages/construction/KDPProject"));
const NadheemProject   = lazy(() => import("./pages/construction/NadheemProject"));

// ─── Portal pages ─────────────────────────────────────────────────────────────
const Portal           = lazy(() => import("./pages/portal/Portal"));
const HRModule         = lazy(() => import("./pages/portal/HRModule"));
const ERPModule        = lazy(() => import("./pages/portal/ERPModule"));
const CRMModule        = lazy(() => import("./pages/portal/CRMModule"));
const KPIModule        = lazy(() => import("./pages/portal/KPIModule"));
const ProcurementModule = lazy(() => import("./pages/portal/ProcurementModule"));
const QMSModule        = lazy(() => import("./pages/portal/QMSModule"));
const LegalModule      = lazy(() => import("./pages/portal/LegalModule"));
const CommsModule      = lazy(() => import("./pages/portal/CommsModule"));
const AuditModule      = lazy(() => import("./pages/portal/AuditModule"));
const GovernanceModule = lazy(() => import("./pages/portal/GovernanceModule"));
const AuthorityMatrix  = lazy(() => import("./pages/portal/AuthorityMatrix"));
const MeetingModule    = lazy(() => import("./pages/portal/MeetingModule"));
const NEOCore          = lazy(() => import("./pages/portal/NEOCore"));
const DriveVault       = lazy(() => import("./pages/portal/DriveVault"));
const NEOChat          = lazy(() => import("./pages/portal/NEOChat"));
const Requests         = lazy(() => import("./pages/portal/Requests"));
const NEOUsage         = lazy(() => import("./pages/portal/NEOUsage"));
const OdooDashboard    = lazy(() => import("./pages/portal/OdooDashboard"));
const OdooAIDataEntry  = lazy(() => import("./pages/portal/OdooAIDataEntry"));
const OdooAuditLog     = lazy(() => import("./pages/portal/OdooAuditLog"));
const PortalSettings   = lazy(() => import("./pages/portal/PortalSettings"));
const BidEvaluation    = lazy(() => import("./pages/portal/BidEvaluation"));
const SupplierBidPortal = lazy(() => import("./pages/SupplierBidPortal"));

// ─── Admin pages ──────────────────────────────────────────────────────────────
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));
const UserManagement   = lazy(() => import("./pages/admin/UserManagement"));
const RolesPermissions = lazy(() => import("./pages/admin/RolesPermissions"));
const SystemSettings   = lazy(() => import("./pages/admin/SystemSettings"));
const PlatformHealth   = lazy(() => import("./pages/admin/PlatformHealth"));
const AdminAuditLog    = lazy(() => import("./pages/admin/AdminAuditLog"));
const ModuleAccess     = lazy(() => import("./pages/admin/ModuleAccess"));

// ─── Router ───────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Switch>
        {/* Public */}
        <Route path="/"                         component={Home} />
        <Route path="/login"                    component={Login} />
        <Route path="/it-solutions"             component={ITSolutions} />
        <Route path="/astra-pm"                 component={AstraPM} />
        <Route path="/consultancy"              component={Consultancy} />
        <Route path="/about"                    component={About} />
        <Route path="/contact"                  component={Contact} />
        <Route path="/neo-architecture"         component={NEOArchitecture} />
        <Route path="/architecture"             component={Architecture} />
        <Route path="/project-plan"             component={ProjectPlan} />
        <Route path="/component-showcase"       component={ComponentShowcase} />

        {/* Construction */}
        <Route path="/construction"             component={Construction} />
        <Route path="/construction/kdp"         component={KDPProject} />
        <Route path="/construction/nadheem"     component={NadheemProject} />

        {/* Portal — auth guard is inside PortalLayout */}
        <Route path="/portal"                   component={Portal} />
        <Route path="/portal/hr"                component={HRModule} />
        <Route path="/portal/erp"               component={ERPModule} />
        <Route path="/portal/crm"               component={CRMModule} />
        <Route path="/portal/kpi"               component={KPIModule} />
        <Route path="/portal/procurement"       component={ProcurementModule} />
        <Route path="/portal/qms"               component={QMSModule} />
        <Route path="/portal/legal"             component={LegalModule} />
        <Route path="/portal/comms"             component={CommsModule} />
        <Route path="/portal/audit"             component={AuditModule} />
        <Route path="/portal/governance"        component={GovernanceModule} />
        <Route path="/portal/governance/authority-matrix" component={AuthorityMatrix} />
        <Route path="/portal/meetings"          component={MeetingModule} />
        <Route path="/portal/neo-core"          component={NEOCore} />
        <Route path="/portal/vault"             component={DriveVault} />
        <Route path="/portal/neo-chat"          component={NEOChat} />
        <Route path="/portal/requests"          component={Requests} />
        <Route path="/portal/neo-usage"         component={NEOUsage} />
        <Route path="/portal/odoo"              component={OdooDashboard} />
        <Route path="/portal/odoo/ai-entry"     component={OdooAIDataEntry} />
        <Route path="/portal/odoo/audit-log"    component={OdooAuditLog} />
        <Route path="/portal/settings"           component={PortalSettings} />
        <Route path="/portal/bid-evaluation"    component={BidEvaluation} />

        {/* Public supplier bid portal — no auth required */}
        <Route path="/rfq/:token"               component={SupplierBidPortal} />

        {/* Admin — auth + role guard is inside AdminLayout */}
        <Route path="/admin"                    component={AdminDashboard} />
        <Route path="/admin/users"              component={UserManagement} />
        <Route path="/admin/roles"              component={RolesPermissions} />
        <Route path="/admin/settings"           component={SystemSettings} />
        <Route path="/admin/health"             component={PlatformHealth} />
        <Route path="/admin/audit"              component={AdminAuditLog} />
        <Route path="/admin/modules"            component={ModuleAccess} />

        {/* Catch-all */}
        <Route path="/404"                      component={NotFound} />
        <Route                                  component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
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
