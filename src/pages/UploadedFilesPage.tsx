import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { API_BASE, ApiError, api } from "../api";
import type { UploadedFile } from "../types";
import { Badge } from "../components/Badge";

export default function UploadedFilesPage({ notify }: { notify: (s:string)=>void }) {
  const [rows,setRows] = useState<UploadedFile[]>([]);
  const [query,setQuery] = useState("");
  const [loading,setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const r:any = await api("/api/grid-import/files"); setRows(r.data || []); }
    catch(e:any){ notify(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>rows.filter(x => {
    const c=x.insuranceCompanyId||{};
    return `${x.fileName} ${x.version} ${x.status} ${c.code} ${c.name}`.toLowerCase().includes(query.toLowerCase());
  }),[rows,query]);

  async function remove(x: UploadedFile) {
    if (!confirm(`Delete ${x.fileName}?`)) return;
    try {
      await api(`/api/grid-import/files/${x._id}`, {method:"DELETE"});
      notify("File deleted."); load();
    } catch(e:any) {
      if (e instanceof ApiError && e.status===409 && e.body?.requiresForce) {
        if (!confirm(`${e.message}\n\nThis will also remove the ACTIVE grid, rules and RTO mappings. Continue?`)) return;
        try { await api(`/api/grid-import/files/${x._id}?force=true`,{method:"DELETE"}); notify("Active grid and file deleted."); load(); }
        catch(e2:any){ notify(e2.message); }
      } else notify(e.message);
    }
  }

  return <section className="card">
    <div className="toolbar">
      <div><h2>Uploaded Grid Files</h2><p>Search, download and safely delete logical grid imports.</p></div>
      <button onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
    </div>
    <div className="searchBox"><Search size={17}/><input placeholder="Search company, file, version or status..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="tableWrap"><table>
      <thead><tr><th>Company</th><th>File</th><th>Version</th><th>Action</th><th>Status</th><th>Counts</th><th>Available</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>{filtered.map(x=>{const c=x.insuranceCompanyId||{};return <tr key={x._id}>
        <td><b>{c.code||"-"}</b><small>{c.name}</small></td>
        <td><b>{x.fileName}</b><small>{x.fileHash?.slice(0,16)}{x.fileHash?"…":""}</small></td>
        <td>{x.version||"-"}</td><td><Badge value={x.action}/></td><td><Badge value={x.status}/></td>
        <td><small>{x.rulesImported||x.rulesDetected||0} rules<br/>{x.rtoMappingsImported||x.rtoMappingsDetected||0} mappings</small></td>
        <td><Badge value={x.fileAvailable?"Yes":"Missing"}/></td>
        <td><small>{x.createdAt?new Date(x.createdAt).toLocaleString():"-"}</small></td>
        <td><div className="rowActions">
          {x.fileAvailable && <a className="button secondary" href={`${API_BASE}/api/grid-import/${x._id}/download`}><Download size={15}/> Download</a>}
          <button className="dangerButton" onClick={()=>remove(x)}><Trash2 size={15}/> Delete</button>
        </div></td>
      </tr>})}</tbody>
    </table></div>
    {!filtered.length && <div className="empty">No uploaded files found.</div>}
  </section>;
}