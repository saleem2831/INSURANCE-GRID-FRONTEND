import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { API_BASE, ApiError, api } from '../api';
import type { GridPackageRow } from '../types';
import { Badge } from '../components/Badge';

export default function GridPackagesPage({notify}:{notify:(s:string)=>void}){
  const [rows,setRows]=useState<GridPackageRow[]>([]);const[query,setQuery]=useState('');const[busy,setBusy]=useState(false);
  async function load(){setBusy(true);try{const r:any=await api('/api/grid-packages');setRows(r.data||[])}catch(e:any){notify(e.message)}finally{setBusy(false)}}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>rows.filter((x:any)=>`${x.insuranceCompanyId?.code} ${x.insuranceCompanyId?.name} ${x.version} ${x.status} ${x.name}`.toLowerCase().includes(query.toLowerCase())),[rows,query]);
  async function remove(row:any){if(!confirm(`Delete package ${row.insuranceCompanyId?.code||''} ${row.version}?`))return;try{await api(`/api/grid-packages/${row._id}`,{method:'DELETE'});notify('Package deleted.');load()}catch(e:any){if(e instanceof ApiError&&e.status===409&&e.body?.requiresForce){if(!confirm(`${e.message}\n\nThis removes the ACTIVE package, its rules and mappings. Continue?`))return;try{await api(`/api/grid-packages/${row._id}?force=true`,{method:'DELETE'});notify('Active package deleted.');load()}catch(e2:any){notify(e2.message)}}else notify(e.message)}}
  return <section className="card"><div className="toolbar"><div><h2>Company Grid Packages</h2><p>One active package per insurer/effective period. Each package can contain multiple interconnected documents.</p></div><button disabled={busy} onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    <div className="searchBox"><Search size={17}/><input placeholder="Search company, package version or status..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="tableWrap"><table><thead><tr><th>Company</th><th>Version</th><th>Status</th><th>Coverage</th><th>Counts</th><th>Documents</th><th>Created</th><th>Actions</th></tr></thead><tbody>{filtered.map((x:any)=><tr key={x._id}><td><b>{x.insuranceCompanyId?.code||'-'}</b><small>{x.insuranceCompanyId?.name}</small></td><td>{x.version}<small>{x.action}</small></td><td><Badge value={x.status}/></td><td><small>{x.productCoverage?.join(', ')||'-'}</small></td><td><small>{x.totalRules||0} rules<br/>{x.totalRtoMappings||0} mappings</small></td><td><details><summary>{x.documents?.length||0} files</summary><div className="packageDocList">{x.documents?.map((d:any)=><div key={d._id}><span><b>{d.fileName}</b><small>{d.role} · {d.status}</small></span><a className="miniLink" href={`${API_BASE}/api/grid-packages/${x._id}/documents/${d._id}/download`}><Download size={13}/> Download</a></div>)}</div></details></td><td><small>{x.createdAt?new Date(x.createdAt).toLocaleString():'-'}</small></td><td><button className="dangerButton" onClick={()=>remove(x)}><Trash2 size={15}/> Delete</button></td></tr>)}</tbody></table></div>{!filtered.length&&<div className="empty">No company grid packages found.</div>}
  </section>
}
