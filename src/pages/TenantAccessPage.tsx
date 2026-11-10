import {useState} from 'react';
import {KeyRound, LockKeyhole, ShieldCheck} from 'lucide-react';
import {api,clearActiveApiKey,setActiveApiKey} from '../api';
export type Session = { mode: 'ADMIN'|'TENANT'|'SINGLE'; name:string; code?:string; tenantId?:string };
export default function TenantAccessPage({onLogin}:{onLogin:(s:Session)=>void}) {
  const [key,setKey]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  async function enter(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setActiveApiKey(key);
    try{const r=await api<{data:Session}>('/api/v1/tenants/session');onLogin(r.data);setKey('');}
    catch(e:any){clearActiveApiKey();setError(e.message||'Invalid credentials');}finally{setBusy(false)}
  }
  return <div className="tenantLoginWrap"><form className="card tenantLogin" onSubmit={enter}>
    <div className="sectionTitle"><LockKeyhole size={27}/><div><h2>Motor Payout Workspace</h2><p>Sign in to view your permitted insurer grids and calculate commission.</p></div></div>
    <div className="accuracyNote"><ShieldCheck size={18}/><span>Each tenant sees only packages explicitly shared with that tenant. Other tenants' rules and files are never included.</span></div>
    <label>Workspace API Key<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="Paste tenant API key or platform admin key" required/></label>
    {error&&<div className="motorIssues motorError" role="alert">{error}</div>}
    <button className="primary" disabled={!key.trim()||busy} type="submit"><KeyRound size={16}/>{busy?'Checking…':'Open Workspace'}</button>
    <p className="motorHelper">Testing mode: the key stays in memory and is cleared on refresh. Use HTTPS. For production, replace browser API keys with user authentication and secure server-side sessions.</p>
  </form></div>;
}
