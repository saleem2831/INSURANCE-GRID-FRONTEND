import { useEffect, useState } from "react";
import { Boxes, Files, FolderUp, GitCompareArrows, Code2, Calculator, ShieldCheck, Upload, LogOut, Users, Library } from "lucide-react";
import { api, API_BASE, clearActiveApiKey } from "./api";
import UploadImportPage from "./pages/UploadImportPage";
import PackageUploadPage from "./pages/PackageUploadPage";
import GridPackagesPage from "./pages/GridPackagesPage";
import UploadedFilesPage from "./pages/UploadedFilesPage";
import ComparePage from "./pages/ComparePage";
import MotorPayoutPage from "./pages/MotorPayoutPage";
import TenantAccessPage, {type Session} from "./pages/TenantAccessPage";
import TenantAdminPage from "./pages/TenantAdminPage";
import TenantPackagesPage from "./pages/TenantPackagesPage";

type Tab = "package-upload"|"packages"|"upload"|"files"|"compare"|"motor"|"developer"|"tenant-admin"|"tenant-packages";
export default function App(){
 const [tab,setTab]=useState<Tab>("motor");
 const [session,setSession]=useState<Session|null>(null);
 const [needsLogin,setNeedsLogin]=useState(false);
 const [health,setHealth]=useState<"checking"|"online"|"offline">("checking");
 const [toast,setToast]=useState("");
 useEffect(()=>{api("/health").then(()=>setHealth("online")).catch(()=>setHealth("offline"));api<{data:Session}>("/api/v1/tenants/session").then(r=>{setSession(r.data);setNeedsLogin(false)}).catch(e=>{if(e?.status===401)setNeedsLogin(true);else setNeedsLogin(true);});},[]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),4200);return()=>clearTimeout(t)},[toast]);
 const isAdmin=session?.mode==="ADMIN"||session?.mode==="SINGLE";
 function logout(){clearActiveApiKey();setSession(null);setNeedsLogin(true);setTab("motor");}
 if(needsLogin&&!session)return <div className="app"><header><div className="brand"><div className="logo"><ShieldCheck/></div><div><h1>Payout Grid</h1><p>Secure tenant-specific motor payout comparison</p></div></div><div className={`health ${health}`}><span/>{health}</div></header><main><TenantAccessPage onLogin={s=>{setSession(s);setNeedsLogin(false);setTab("motor")}}/></main></div>;
 return <div className="app">
  <header><div className="brand"><div className="logo"><ShieldCheck/></div><div><h1>Payout Grid</h1><p>Tenant-scoped motor commission, backed by approved insurer grids</p></div></div>
  <div className="tenantHeaderStatus"><span>{session?.name||"Checking workspace…"}</span>{session?.mode!=="SINGLE"&&<button className="tenantLogout" onClick={logout}><LogOut size={14}/> Sign out</button>}<div className={`health ${health}`}><span></span>{health}</div></div></header>
  <nav>
   <button className={tab==="motor"?"active":""} onClick={()=>setTab("motor")}><Calculator size={17}/> Find Motor Payout</button>
   {session?.mode==="TENANT"&&<button className={tab==="tenant-packages"?"active":""} onClick={()=>setTab("tenant-packages")}><Library size={17}/> My Grids</button>}
   <button className={tab==="developer"?"active":""} onClick={()=>setTab("developer")}><Code2 size={17}/> Developer API</button>
   {isAdmin&&<>
    {session?.mode==="ADMIN"&&<button className={tab==="tenant-admin"?"active":""} onClick={()=>setTab("tenant-admin")}><Users size={17}/> Tenant Administration</button>}
    <button className={tab==="package-upload"?"active":""} onClick={()=>setTab("package-upload")}><FolderUp size={17}/> Company Package</button>
    <button className={tab==="packages"?"active":""} onClick={()=>setTab("packages")}><Boxes size={17}/> Packages</button>
    <button className={tab==="upload"?"active":""} onClick={()=>setTab("upload")}><Upload size={17}/> Single File (Legacy)</button>
    <button className={tab==="files"?"active":""} onClick={()=>setTab("files")}><Files size={17}/> Legacy Files</button>
    <button className={tab==="compare"?"active":""} onClick={()=>setTab("compare")}><GitCompareArrows size={17}/> Compare Commission</button>
   </>}
  </nav>
  <main>
   {tab==="motor"&&<MotorPayoutPage notify={setToast}/>}
   {tab==="tenant-packages"&&session?.mode==="TENANT"&&<TenantPackagesPage/>}
   {tab==="tenant-admin"&&session?.mode==="ADMIN"&&<TenantAdminPage notify={setToast}/>}
   {tab==="developer"&&<section className="card stack"><div className="sectionTitle"><Code2/><div><h2>Developer API & Swagger</h2><p>Validated motor input and tenant-isolated insurer comparison</p></div></div><div className="motorDeveloperLinks"><a className="primary button" target="_blank" rel="noopener noreferrer" href={`${API_BASE}/api-docs/`}>Open Swagger UI</a><a className="button" target="_blank" rel="noopener noreferrer" href={`${API_BASE}/api-docs/openapi.json`}>OpenAPI JSON</a></div><p><b>GET</b> /api/v1/motor/options — input catalog.</p><p><b>GET</b> /api/v1/motor/form-config/:motorTypeId — conditional fields.</p><p><b>POST</b> /api/v1/motor/compare — compares only tenant-assigned packages.</p><p><b>GET</b> /api/v1/tenants/session — tenant session details.</p><p><b>GET</b> /api/v1/tenants/tenant/visible-packages — packages available to this tenant.</p><p className="motorHelper">Set <code>x-api-key</code> for tenant API calls. Keys are not placed in the request body, query string or tenant ID. A tenant cannot select or impersonate another workspace.</p></section>}
   {isAdmin&&<>{tab==="package-upload"&&<PackageUploadPage onOpenPackages={()=>setTab("packages")} notify={setToast}/>} {tab==="packages"&&<GridPackagesPage notify={setToast}/>} {tab==="upload"&&<UploadImportPage onOpenFiles={()=>setTab("files")} notify={setToast}/>} {tab==="files"&&<UploadedFilesPage notify={setToast}/>} {tab==="compare"&&<ComparePage notify={setToast}/>}</>}
  </main>
  {toast&&<div className="toast">{toast}</div>}
 </div>;
}
