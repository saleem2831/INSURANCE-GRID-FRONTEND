import {useEffect,useState} from 'react';
import {api} from '../api';
type Package = {id:string;company?:{code:string;name:string};version:string;effectiveFrom:string;effectiveTo?:string;products:string[];status:string};
export default function TenantPackagesPage(){
 const [rows,setRows]=useState<Package[]>([]),[error,setError]=useState('');
 useEffect(()=>{api<{data:Package[]}>('/api/v1/tenants/tenant/visible-packages').then(r=>setRows(r.data)).catch(e=>setError(e.message))},[]);
 return <section className="card"><h2>My Insurer Grids</h2><p className="motorHelper">Only explicitly assigned insurer packages are shown. Historical versions are retained for earlier quote dates. Source documents and administration remain private.</p>
 {error&&<div role="alert" className="motorIssues motorError">{error}</div>}
 <div className="tableWrap"><table><thead><tr><th>Insurer</th><th>Grid Version</th><th>Effective From</th><th>Product Coverage</th><th>Status</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><b>{x.company?.name||x.company?.code}</b><small>{x.company?.code}</small></td><td>{x.version}</td><td>{String(x.effectiveFrom).slice(0,10)}</td><td>{x.products?.join(', ')||'—'}</td><td>{x.status}</td></tr>)}</tbody></table></div>
 {!rows.length&&!error&&<p className="empty">No grids have been assigned to your workspace. Ask your platform administrator to assign an ACTIVE insurer package.</p>}
 </section>;
}
