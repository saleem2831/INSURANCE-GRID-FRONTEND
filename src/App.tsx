import { useEffect, useState } from "react";
import { Boxes, Files, FolderUp, GitCompareArrows, ShieldCheck, Upload } from "lucide-react";
import { api } from "./api";
import UploadImportPage from "./pages/UploadImportPage";
import PackageUploadPage from "./pages/PackageUploadPage";
import GridPackagesPage from "./pages/GridPackagesPage";
import UploadedFilesPage from "./pages/UploadedFilesPage";
import ComparePage from "./pages/ComparePage";

type Tab = "package-upload" | "packages" | "upload" | "files" | "compare";

export default function App() {
  const [tab,setTab]=useState<Tab>("package-upload");
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
      <button className={tab==="package-upload"?"active":""} onClick={()=>setTab("package-upload")}><FolderUp size={17}/> Company Package</button>
      <button className={tab==="packages"?"active":""} onClick={()=>setTab("packages")}><Boxes size={17}/> Packages</button>
      <button className={tab==="upload"?"active":""} onClick={()=>setTab("upload")}><Upload size={17}/> Single File (Legacy)</button>
      <button className={tab==="files"?"active":""} onClick={()=>setTab("files")}><Files size={17}/> Legacy Files</button>
      <button className={tab==="compare"?"active":""} onClick={()=>setTab("compare")}><GitCompareArrows size={17}/> Compare Commission</button>
    </nav>
    <main>
      {tab==="package-upload" && <PackageUploadPage onOpenPackages={()=>setTab("packages")} notify={setToast}/>}
      {tab==="packages" && <GridPackagesPage notify={setToast}/>}
      {tab==="upload" && <UploadImportPage onOpenFiles={()=>setTab("files")} notify={setToast}/>}
      {tab==="files" && <UploadedFilesPage notify={setToast}/>}
      {tab==="compare" && <ComparePage notify={setToast}/>}
    </main>
    {toast && <div className="toast">{toast}</div>}
  </div>;
}