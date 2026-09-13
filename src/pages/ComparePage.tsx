import { useEffect, useMemo, useState } from 'react';
import { Calculator, ChevronDown, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { PRODUCT_OPTIONS, STATUS_LABELS } from '../constants';
import type { ComparisonData, ComparisonResult, FieldDefinition, InputSchema, MissingField } from '../types';
import { Badge } from '../components/Badge';

const today = new Date().toISOString().slice(0,10);
const nestedRoots = new Set(['businessMetrics','premium']);

function setPath(target:any,path:string,value:any){
  const parts=path.split('.'); let cur=target;
  for(let i=0;i<parts.length-1;i++){cur[parts[i]] ||= {};cur=cur[parts[i]];}
  cur[parts[parts.length-1]]=value;
}
function convert(v:string, type?:string){ if(v==='')return undefined; if(type==='number'){const n=Number(v);return Number.isFinite(n)?n:undefined;} if(type==='boolean')return v==='true'; return v; }
function buildPayload(product:string, values:Record<string,string>, defs:Record<string,FieldDefinition|MissingField>){
  const out:any={product};
  for(const [field,raw] of Object.entries(values)){
    if(field==='product'||raw==='')continue; const value=convert(raw,(defs[field] as any)?.type); if(value===undefined)continue; setPath(out,field,value);
  }
  return out;
}
function fieldControl(def:FieldDefinition|MissingField,value:string,onChange:(v:string)=>void){
  const opts=(def as any).options||[]; const type=(def as any).type||'text';
  if(opts.length) return <select value={value} onChange={e=>onChange(e.target.value)}><option value="">Select</option>{opts.map((o:any,i:number)=>{const val=typeof o==='object'&&o!==null&&'value'in o?o.value:o;const lab=typeof o==='object'&&o!==null&&'label'in o?o.label:String(o);return <option key={`${String(val)}-${i}`} value={String(val)}>{lab}</option>})}</select>;
  if(type==='boolean')return <select value={value} onChange={e=>onChange(e.target.value)}><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select>;
  return <input type={type==='number'?'number':type==='date'?'date':'text'} step={type==='number'?'any':undefined} value={value} placeholder={(def as any).placeholder||''} onChange={e=>onChange(e.target.value)}/>;
}

function ResultCard({r}:{r:ComparisonResult}){
  const matched=r.status==='MATCHED'; const needs=r.status==='NEEDS_INPUT';
  return <article className={`payoutCard ${matched?'matched':needs?'needs':''}`}>
    <div className="payoutTop"><div><h3>{r.companyName||r.companyCode}</h3><span>{r.companyCode}</span></div>{matched?<div className="payoutPct">{r.percentage}%</div>:<Badge value={r.displayStatus||STATUS_LABELS[r.status||'']||r.status}/>}</div>
    {matched&&<>
      <div className="payoutMeta"><span>{r.gridVersion||'Active grid'}</span>{r.matchedCluster&&<span>Cluster: {r.matchedCluster}</span>}</div>
      {r.payoutComponents&&r.payoutComponents.length>0&&<div className="components">{r.payoutComponents.map((c,i)=><span key={`${c.basis}-${i}`}>{c.basis} {c.percentage}%{typeof c.commissionAmount==='number'?` · ₹${c.commissionAmount.toLocaleString('en-IN')}`:''}</span>)}{typeof r.commissionAmount==='number'&&<b>Total ₹{r.commissionAmount.toLocaleString('en-IN')}</b>}</div>}
      {r.percentageComponents&&Number(r.percentageComponents.incremental||0)!==0&&<div className="components"><span>Base {r.percentageComponents.base}%</span><span>Incremental {Number(r.percentageComponents.incremental)>0?'+':''}{r.percentageComponents.incremental}%</span><b>Final {r.percentageComponents.final}%</b></div>}
      <details className="sourceDetails"><summary>Verified source</summary><div>{r.percentageAudit?.fileName||r.source?.fileName||'-'}</div><div>{r.percentageAudit?.sheet||r.source?.sheet||'-'}{(r.percentageAudit?.row||r.source?.row)?` · row ${r.percentageAudit?.row||r.source?.row}`:''}{r.percentageAudit?.column?` · ${r.percentageAudit.column}`:''}</div><div>Source value: {r.percentageAudit?.sourceText||r.source?.originalText||'-'}</div><div>Rule: {r.ruleCode||'-'}</div></details>
    </>}
    {!matched&&<div className="resultMessage">{r.message||r.reason||STATUS_LABELS[r.status||'']||r.status}</div>}
  </article>
}

export default function ComparePage({notify}:{notify:(s:string)=>void}){
  const [product,setProduct]=useState('GCV'); const [schema,setSchema]=useState<InputSchema|null>(null); const [values,setValues]=useState<Record<string,string>>({policyDate:today});
  const [result,setResult]=useState<ComparisonData|null>(null); const [busy,setBusy]=useState(false);
  const [search,setSearch]=useState(''); const [insurer,setInsurer]=useState('ALL'); const [status,setStatus]=useState('ALL'); const [sort,setSort]=useState('payout_desc'); const [matchedOnly,setMatchedOnly]=useState(false);

  useEffect(()=>{setResult(null);api<any>(`/api/commission/input-schema/${product}`).then(r=>{setSchema(r.data);setValues(v=>({policyDate:v.policyDate||today}));}).catch(e=>notify(e.message));},[product]);
  const baseDefs=useMemo(()=>{const m:Record<string,FieldDefinition>={};for(const d of [...(schema?.context||[]),...(schema?.required||[])])m[d.field]=d;return m;},[schema]);
  const dynamic=useMemo(()=>{const map=new Map<string,{def:MissingField;companies:Set<string>}>();for(const r of result?.results||[])if(r.status==='NEEDS_INPUT')for(const f of r.missingFields||[]){const cur=map.get(f.field)||{def:f,companies:new Set<string>()};cur.companies.add(r.companyName||r.companyCode||'Insurer');if((f.options||[]).length>(cur.def.options||[]).length)cur.def=f;map.set(f.field,cur);}return [...map.entries()];},[result]);
  const allDefs=useMemo(()=>{const m:any={...baseDefs};for(const [field,x] of dynamic)m[field]=x.def;return m;},[baseDefs,dynamic]);
  const missingBase=(schema?.required||[]).filter(d=>!String(values[d.field]||'').trim());

  async function compare(){ if(missingBase.length){notify(`Complete: ${missingBase.map(x=>x.label).join(', ')}`);return;} setBusy(true);try{const payload=buildPayload(product,values,allDefs);const r:any=await api('/api/commission/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});setResult(r.data);notify('Payout comparison completed using ACTIVE source grids.');}catch(e:any){notify(e.message)}finally{setBusy(false)} }

  const rows=useMemo(()=>{let x=[...(result?.results||[])];const q=search.trim().toLowerCase();if(q)x=x.filter(r=>`${r.companyName} ${r.companyCode} ${r.status} ${r.ruleCode}`.toLowerCase().includes(q));if(insurer!=='ALL')x=x.filter(r=>r.companyCode===insurer);if(status!=='ALL')x=x.filter(r=>r.status===status);if(matchedOnly)x=x.filter(r=>r.status==='MATCHED');const score=(r:ComparisonResult)=>typeof r.commissionAmount==='number'?r.commissionAmount:(typeof r.percentage==='number'?r.percentage:-1);x.sort((a,b)=>sort==='insurer'?String(a.companyName).localeCompare(String(b.companyName)):sort==='payout_asc'?score(a)-score(b):score(b)-score(a));return x;},[result,search,insurer,status,matchedOnly,sort]);
  const statusOptions=['ALL',...Array.from(new Set((result?.results||[]).map(x=>x.status||''))).filter(Boolean)];
  const insurerOptions=['ALL',...Array.from(new Set((result?.results||[]).map(x=>x.companyCode||''))).filter(Boolean)];

  return <div className="stack">
    <section className="card payoutSearchCard">
      <div className="sectionTitle"><Calculator size={26}/><div><h2>Find Motor Payout</h2><p>Only the minimum payout-dependent parameters are requested first.</p></div></div>
      <div className="accuracyNote"><ShieldCheck size={19}/><div><b>Accuracy-first comparison</b><span>Percentages are shown only from an exact executable source rule. Ambiguous conditions are withheld as Manual Review rather than guessed.</span></div></div>
      <div className="compactInputs">
        <label>Product<select value={product} onChange={e=>setProduct(e.target.value)}>{PRODUCT_OPTIONS.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        {(schema?.context||[]).map(d=><label key={d.field}>{d.label}{fieldControl(d,values[d.field]||'',v=>setValues({...values,[d.field]:v}))}</label>)}
        {(schema?.required||[]).map(d=><label key={d.field}>{d.label} *{fieldControl(d,values[d.field]||'',v=>setValues({...values,[d.field]:v}))}</label>)}
      </div>
      <button className="primary fetchButton" disabled={busy||missingBase.length>0} onClick={compare}>{busy?<RefreshCw className="spin" size={17}/>:<Calculator size={17}/>} Fetch Payouts</button>
    </section>

    {result&&dynamic.length>0&&<section className="card additionalCard"><div className="sectionTitle"><ChevronDown size={22}/><div><h2>Additional information required</h2><p>These fields are shown only because one or more insurer source grids require them for this exact risk.</p></div></div><div className="compactInputs">{dynamic.map(([field,x])=><label key={field}>{x.def.label||field}<small>{[...x.companies].join(', ')}</small>{fieldControl(x.def,values[field]||'',v=>setValues({...values,[field]:v}))}</label>)}</div><button className="primary" onClick={compare}>Recalculate all insurers</button></section>}

    {result&&<>
      <div className="summaryStrip"><div><span>Insurers checked</span><b>{result.insurersChecked||0}</b></div><div><span>Matched</span><b>{result.matchedInsurers||0}</b></div><div><span>Need input</span><b>{result.needsInput||0}</b></div><div><span>Best payout</span><b>{typeof result.bestPayout?.commissionAmount==='number'?`₹${result.bestPayout.commissionAmount.toLocaleString('en-IN')}`:(typeof result.bestPayout?.percentage==='number'?`${result.bestPayout.percentage}%`:(result.bestPayout?.percentageDisplay||'-'))}</b><small>{result.bestPayout?.companyName||''}</small></div></div>
      <section className="card"><div className="toolbar"><div><h2>Payout Results</h2><p>Showing {rows.length} of {result.results?.length||0} insurer results.</p></div><Filter size={20}/></div>
        <div className="payoutFilters"><div className="searchBox"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search insurer, status or rule..."/></div><select value={insurer} onChange={e=>setInsurer(e.target.value)}>{insurerOptions.map(x=><option key={x} value={x}>{x==='ALL'?'All insurers':x}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}>{statusOptions.map(x=><option key={x} value={x}>{x==='ALL'?'All statuses':STATUS_LABELS[x]||x}</option>)}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="payout_desc">Payout: High → Low</option><option value="payout_asc">Payout: Low → High</option><option value="insurer">Insurer A → Z</option></select><label className="checkbox filterCheck"><input type="checkbox" checked={matchedOnly} onChange={e=>setMatchedOnly(e.target.checked)}/> Matched only</label></div>
        <div className="payoutGrid">{rows.map((r,i)=><ResultCard key={`${r.companyCode}-${i}`} r={r}/>)}</div>{!rows.length&&<div className="empty">No results match the selected filters.</div>}
      </section>
    </>}
  </div>
}
