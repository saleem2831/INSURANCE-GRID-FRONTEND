import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderOpen, Layers3, RefreshCw, UploadCloud } from 'lucide-react';
import { api } from '../api';
import type { GridDocumentRole, GridPackagePreview, Insurer } from '../types';
import { Badge } from '../components/Badge';
import { Metric } from '../components/Metric';

const ROLES: GridDocumentRole[] = [
  'PAYOUT_GRID','PRODUCT_GRID','RTO_MASTER','CLUSTER_MASTER','INCREMENTAL_GRID','EXCLUSION_GRID','GUIDELINES','LOOKUP_MASTER','REFERENCE_DOCUMENT'
];

type Props={onOpenPackages:()=>void;notify:(s:string)=>void};

export default function PackageUploadPage({onOpenPackages,notify}:Props){
  const [companies,setCompanies]=useState<Insurer[]>([]);
  const [selected,setSelected]=useState('CUSTOM');
  const [files,setFiles]=useState<File[]>([]);
  const [preview,setPreview]=useState<GridPackagePreview|null>(null);
  const [busy,setBusy]=useState(false);
  const [activate,setActivate]=useState(true);
  const [meta,setMeta]=useState({companyCode:'',companyName:'',version:'SEP-2026',effectiveFrom:'2026-09-01',effectiveTo:'2026-09-30'});

  async function loadCompanies(){try{const r:any=await api('/api/insurance-companies');setCompanies(r.data||[])}catch(e:any){notify(e.message)}}
  useEffect(()=>{loadCompanies()},[]);
  function chooseCompany(code:string){setSelected(code);const c=companies.find(x=>x.code===code);if(c)setMeta(m=>({...m,companyCode:c.code,companyName:c.name}));else setMeta(m=>({...m,companyCode:'',companyName:''}));setPreview(null)}
  function chooseFiles(list:FileList|null){const rows=Array.from(list||[]);setFiles(rows);setPreview(null)}

  async function previewPackage(){
    if(!files.length)return notify('Select a company folder or multiple grid files first.');
    if(!meta.companyCode||!meta.companyName)return notify('Company code and company name are required.');
    setBusy(true);
    try{
      const fd=new FormData();
      files.forEach(f=>fd.append('files',f,f.name));
      const relativePaths=files.map(f=>(f as any).webkitRelativePath||f.name);
      fd.append('relativePaths',JSON.stringify(relativePaths));
      fd.append('sourceType',relativePaths.some(p=>p.includes('/'))?'COMPANY_FOLDER':files.length===1?'SINGLE_FILE':'MULTI_FILE');
      Object.entries(meta).forEach(([k,v])=>v&&fd.append(k,v));
      const r:any=await api('/api/grid-packages/preview',{method:'POST',body:fd});
      setPreview(r.data);
      await loadCompanies();
      notify(r.data?.duplicate?'PACKAGE EXISTS: exact document set already uploaded.':r.data?.canCommit?'Package validated. Review document roles before activation.':'Package stored; review validation errors/warnings.');
    }catch(e:any){notify(e.message)}finally{setBusy(false)}
  }

  async function refreshPackage(){if(!preview?.packageId)return;setBusy(true);try{const r:any=await api(`/api/grid-packages/${preview.packageId}/revalidate`,{method:'POST'});setPreview(r.data);notify('Package revalidated.')}catch(e:any){notify(e.message)}finally{setBusy(false)}}
  async function updateDoc(docId:string,patch:any){if(!preview?.packageId)return;setBusy(true);try{const r:any=await api(`/api/grid-packages/${preview.packageId}/documents/${docId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});setPreview(r.data);notify('Document role updated and package revalidated.')}catch(e:any){notify(e.message)}finally{setBusy(false)}}
  async function commit(){if(!preview?.packageId)return;setBusy(true);try{const r:any=await api(`/api/grid-packages/${preview.packageId}/commit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({activate})});notify(`Company package committed: ${r.data?.status||'done'}`);onOpenPackages()}catch(e:any){notify(e.message)}finally{setBusy(false)}}

  return <div className="stack">
    <section className="card">
      <div className="sectionTitle"><Layers3 size={26}/><div><h2>Company Grid Package</h2><p>Upload one file or an entire company folder. Related payout, RTO, cluster and product files are validated as one effective package.</p></div></div>
      <div className="accuracyNote"><CheckCircle2 size={19}/><div><b>V7 package rule</b><span>One insurer + one effective period = one active package, whether the insurer supplied 1 file or 20 files.</span></div></div>
      <div className="formGrid">
        <label>Insurance company<select value={selected} onChange={e=>chooseCompany(e.target.value)}><option value="CUSTOM">+ New / custom insurer</option>{companies.map(c=><option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}</select></label>
        <label>Company code<input value={meta.companyCode} disabled={selected!=='CUSTOM'} onChange={e=>setMeta({...meta,companyCode:e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g,'_')})}/></label>
        <label>Company name<input value={meta.companyName} disabled={selected!=='CUSTOM'} onChange={e=>setMeta({...meta,companyName:e.target.value})}/></label>
        <label>Version<input value={meta.version} onChange={e=>setMeta({...meta,version:e.target.value.toUpperCase()})}/></label>
        <label>Effective from<input type="date" value={meta.effectiveFrom} onChange={e=>setMeta({...meta,effectiveFrom:e.target.value})}/></label>
        <label>Effective to<input type="date" value={meta.effectiveTo} onChange={e=>setMeta({...meta,effectiveTo:e.target.value})}/></label>
      </div>
      <div className="packagePickers">
        <label className="dropzone compactDrop"><FolderOpen size={30}/><input type="file" multiple {...({webkitdirectory:'',directory:''} as any)} onChange={e=>chooseFiles(e.target.files)}/><strong>Select Company Folder</strong><span>Recommended for Tata/HDFC/Royal and other multi-file insurers</span></label>
        <label className="dropzone compactDrop"><UploadCloud size={30}/><input type="file" multiple accept=".xlsx,.xls,.xlsb,.pdf" onChange={e=>chooseFiles(e.target.files)}/><strong>Select Multiple Files</strong><span>XLSX, XLS, XLSB and PDF · up to 50 documents</span></label>
      </div>
      {!!files.length&&<div className="selectedFiles"><b>{files.length} document(s) selected</b>{files.slice(0,18).map((f,i)=><span key={i}>{(f as any).webkitRelativePath||f.name}</span>)}{files.length>18&&<span>+ {files.length-18} more…</span>}</div>}
      <button className="primary" disabled={!files.length||busy} onClick={previewPackage}><Layers3 size={16}/> Upload, Inspect & Validate Package</button>
    </section>

    {preview&&<section className="card">
      <div className="toolbar"><div><h2>Package Validation</h2><p>Confirm document roles and parser output before activation.</p></div><button disabled={busy||!preview.packageId} onClick={refreshPackage}><RefreshCw size={16}/> Revalidate</button></div>
      {preview.duplicate&&<div className="alert warning"><AlertTriangle/><div><b>PACKAGE EXISTS</b><span>{preview.message}</span></div></div>}
      <div className="metrics"><Metric label="Status" value={preview.status}/><Metric label="Documents" value={preview.totalDocuments}/><Metric label="Rules" value={preview.totalRules}/><Metric label="RTO mappings" value={preview.totalRtoMappings}/><Metric label="Products" value={(preview.productCoverage||[]).join(', ')||'-'}/></div>
      {!!preview.warnings?.length&&<div className="message warning"><b>Package warnings</b>{preview.warnings.slice(0,20).map((x,i)=><span key={i}>{x}</span>)}</div>}
      {!!preview.errors?.length&&<div className="message danger"><b>Blocking errors</b>{preview.errors.slice(0,30).map((x,i)=><span key={i}>{x}</span>)}</div>}
      {preview.errors?.some(x=>x.includes('PARSER_REQUIRED'))&&<div className="alert info"><AlertTriangle/><div><b>New/unsupported insurer format</b><span>Create an active generic parser profile for a simple row-table workbook, or add a deterministic custom parser for a complex matrix. Then revalidate this stored package; do not guess payout rules.</span></div></div>}
      <div className="tableWrap"><table className="packageTable"><thead><tr><th>Document</th><th>Role</th><th>Products</th><th>Required</th><th>Parser</th><th>Status</th><th>Output</th></tr></thead><tbody>
        {preview.documents?.map(d=><tr key={d.id}><td><b>{d.fileName}</b><small>{d.relativePath}</small></td><td><select value={d.role} disabled={busy||preview.status==='ACTIVE'} onChange={e=>updateDoc(d.id,{role:e.target.value})}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select></td><td><small>{d.productScope?.join(', ')||'ALL / inferred'}</small></td><td><label className="inlineCheck"><input type="checkbox" checked={!!d.required} disabled={busy||preview.status==='ACTIVE'} onChange={e=>updateDoc(d.id,{required:e.target.checked})}/> required</label></td><td><small>{d.parser||'-'}</small></td><td><Badge value={d.status}/></td><td><small>{d.rulesDetected||0} rules<br/>{d.rtoMappingsDetected||0} mappings</small>{!!d.errors?.length&&<span className="tinyError">{d.errors[0]}</span>}</td></tr>)}
      </tbody></table></div>
      {!preview.duplicate&&<div className="actions"><label className="checkbox"><input type="checkbox" checked={activate} onChange={e=>setActivate(e.target.checked)}/> Activate this package after commit</label><button className="primary" disabled={!preview.canCommit||busy} onClick={commit}><CheckCircle2 size={16}/> Commit Company Package</button></div>}
    </section>}
  </div>
}
