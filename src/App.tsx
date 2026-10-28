import { useEffect, useState } from "react";
import { Boxes, Files, FolderUp, GitCompareArrows, Code2, Calculator, ShieldCheck, Upload } from "lucide-react";
import { api } from "./api";
import UploadImportPage from "./pages/UploadImportPage";
import PackageUploadPage from "./pages/PackageUploadPage";
import GridPackagesPage from "./pages/GridPackagesPage";
import UploadedFilesPage from "./pages/UploadedFilesPage";
import ComparePage from "./pages/ComparePage";
import MotorPayoutPage from "./pages/MotorPayoutPage";
import { API_BASE } from "./api";

type Tab = "package-upload" | "packages" | "upload" | "files" | "compare" | "motor" | "developer";

export default function App() {
  const [tab,setTab]=useState<Tab>("motor");
  const [health,setHealth]=useState<"checking"|"online"|"offline">("checking");
  const [toast,setToast]=useState("");

  useEffect(()=>{api("/health").then(()=>setHealth("online")).catch(()=>setHealth("offline"));},[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),4200);return()=>clearTimeout(t)},[toast]);

  return <div className="app">
    <header>
      <div className="brand"><div className="logo"><ShieldCheck/></div><div><h1>Payout Grid</h1><p>Live motor payout comparison from validated insurer grids</p></div></div>
      <div className={`health ${health}`}><span></span>{health}</div>
    </header>
    <nav>
      <button className={tab==="motor"?"active":""} onClick={()=>setTab("motor")}><Calculator size={17}/> Find Motor Payout</button>
      <button className={tab==="developer"?"active":""} onClick={()=>setTab("developer")}><Code2 size={17}/> Developer API</button>
      <button className={tab==="package-upload"?"active":""} onClick={()=>setTab("package-upload")}><FolderUp size={17}/> Company Package</button>
      <button className={tab==="packages"?"active":""} onClick={()=>setTab("packages")}><Boxes size={17}/> Packages</button>
      <button className={tab==="upload"?"active":""} onClick={()=>setTab("upload")}><Upload size={17}/> Single File (Legacy)</button>
      <button className={tab==="files"?"active":""} onClick={()=>setTab("files")}><Files size={17}/> Legacy Files</button>
      <button className={tab==="compare"?"active":""} onClick={()=>setTab("compare")}><GitCompareArrows size={17}/> Compare Commission</button>
    </nav>
    <main>
      {tab==="motor" && <MotorPayoutPage notify={setToast}/>}
      {tab==="developer" && <section className="card stack"><div className="sectionTitle"><Code2/><div><h2>Developer API & Swagger</h2><p>Explore endpoints, test request/response validation and integrate with your policy system.</p></div></div><div className="motorDeveloperLinks"><a className="primary button" target="_blank" rel="noopener noreferrer" href={`${API_BASE}/api-docs/`}>Open Swagger UI</a><a className="button" target="_blank" rel="noopener noreferrer" href={`${API_BASE}/api-docs/openapi.json`}>OpenAPI JSON</a></div><p><b>GET</b> /api/v1/motor/options — all dropdown catalogue IDs.</p><p><b>GET</b> /api/v1/motor/form-config/:motorTypeId — motor-specific fields.</p><p><b>POST</b> /api/v1/motor/validate — field-level validation and normalized inputs.</p><p><b>POST</b> /api/v1/motor/compare — runs the original deterministic payout engine.</p><p className="motorHelper">The legacy /api/commission/compare endpoint remains available for existing integrations. New numeric-ID requests must use /api/v1/motor/compare.</p></section>}
      {tab==="package-upload" && <PackageUploadPage onOpenPackages={()=>setTab("packages")} notify={setToast}/>}
      {tab==="packages" && <GridPackagesPage notify={setToast}/>}
      {tab==="upload" && <UploadImportPage onOpenFiles={()=>setTab("files")} notify={setToast}/>}
      {tab==="files" && <UploadedFilesPage notify={setToast}/>}
      {tab==="compare" && <ComparePage notify={setToast}/>}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}