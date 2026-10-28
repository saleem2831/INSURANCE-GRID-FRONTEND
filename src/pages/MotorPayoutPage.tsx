import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calculator, CheckCircle2, ClipboardCheck, ExternalLink, Filter, Search, ShieldCheck } from 'lucide-react';
import { API_BASE, ApiError, api } from '../api';
import type { ComparisonData, ComparisonResult, MissingField } from '../types';
import { ResultCard } from './ComparePage';

type Option = { id:number; code:string; label:string };
type PolicyOption = Option & { enginePolicyType:string };
type MotorOption = Option & { product:string; capacityDimension:string; vehicleAgeRequired:boolean };
type CapacityOption = Option & {dimension:string; min:number|null; max:number|null};
type Catalog={version:string;policyTypes:PolicyOption[];motorTypes:MotorOption[];fuelTypes:Option[];capacities:CapacityOption[]};
type FormConfig={ motor:MotorOption;capacityDimension:string;capacityRequired:boolean;vehicleAgeRequired:boolean;capacityOptions:CapacityOption[];note?:string };
type Issue={field:string;code:string;message:string};
type MotorForm={ policy_type_id:number;motor_type_id:number;fuel_type_id:number;capacity_id:string;capacity_value:string;policy_date:string;rto:string;vehicle_make:string;vehicle_age:string;ncb:string;model:string;gwp:string;odPremium:string;tpPremium:string;monthlyGwp:string; };
const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const initialForm:MotorForm={policy_type_id:1,motor_type_id:17,fuel_type_id:2,capacity_id:'',capacity_value:'',policy_date:day(),rto:'',vehicle_make:'',vehicle_age:'',ncb:'0',model:'',gwp:'',odPremium:'',tpPremium:'',monthlyGwp:''};
const amount=(v:string)=>v.trim()===''?undefined:Number(v);
function readNumber(id:string){return Number(id);}
const statusLabel=(s:string)=>({MATCHED:'Matched',NO_ACTIVE_GRID:'No active grid',NO_GRID:'No active grid',NO_MATCH:'Not matched',NO_RULES:'Not applicable',NEEDS_INPUT:'More details required',DECLINE:'Declined',NO_BUSINESS:'Not offered',MANUAL_REVIEW:'Manual review',NO_RTO_MAPPING:'RTO mapping missing'} as Record<string,string>)[s]||s;
function Entry({label,help,required,children,issue}:{label:string;help?:string;required?:boolean;children:React.ReactNode;issue?:string}){
  return <label className="motorEntry"><span>{label}{required&&<em> *</em>}</span>{children}{help&&<small>{help}</small>}{issue&&<span className="motorFieldError">{issue}</span>}</label>;
}
export default function MotorPayoutPage({notify}:{notify:(s:string)=>void}){
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [form,setForm]=useState<MotorForm>(initialForm);
  const [config,setConfig]=useState<FormConfig|null>(null);
  const [errors,setErrors]=useState<Issue[]>([]);
  const [warnings,setWarnings]=useState<Issue[]>([]);
  const [results,setResults]=useState<ComparisonData|null>(null);
  const [extra,setExtra]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState('');
  const [matchedOnly,setMatchedOnly]=useState(false);
  const [showAdvanced,setShowAdvanced]=useState(false);
  const [loadError,setLoadError]=useState('');
  const [sort,setSort]=useState('payout');
  const update=(field:keyof MotorForm,value:string|number)=>{setForm(f=>({...f,[field]:value}));setErrors(x=>x.filter(z=>z.field!==field));};

  useEffect(()=>{
    let active=true;
    api<{data:Catalog}>('/api/v1/motor/options').then(r=>{if(active)setCatalog(r.data);}).catch((e:Error)=>{if(active)setLoadError(e.message)});
    return()=>{active=false};
  },[]);
  useEffect(()=>{
    if(!catalog)return;
    let active=true;
    api<{data:FormConfig}>(`/api/v1/motor/form-config/${form.motor_type_id}?fuelTypeId=${form.fuel_type_id}`).then(r=>{
      if(!active)return;
      setConfig(r.data);
      setForm(f=>({...f,capacity_id:''}));
    }).catch((e:Error)=>{if(active)setLoadError(e.message)});
    return()=>{active=false};
  },[catalog,form.motor_type_id,form.fuel_type_id]);

  const motor=catalog?.motorTypes.find(x=>x.id===form.motor_type_id);
  const fuel=catalog?.fuelTypes.find(x=>x.id===form.fuel_type_id);
  const capLabel=config?.capacityDimension==='GVW'?'GVW (kg)':config?.capacityDimension==='CC'?'Engine CC':config?.capacityDimension==='SEATS'?'Seats':config?.capacityDimension==='WATT'?'Motor power (watts)':'Capacity';
  const err=(field:string)=>errors.find(x=>x.field===field)?.message;
  const dynamic=useMemo(()=>{
    const by=new Map<string,{def:MissingField;insurers:Set<string>}>();
    for(const item of results?.results||[])if(item.status==='NEEDS_INPUT')for(const f of item.missingFields||[]){
      const current=by.get(f.field)||{def:f,insurers:new Set<string>()};current.insurers.add(item.companyName||item.companyCode||'Insurer');by.set(f.field,current);
    }
    return [...by.entries()];
  },[results]);

  const build=()=>{
    const payload:Record<string,unknown>={
      policy_type_id:form.policy_type_id,motor_type_id:form.motor_type_id,fuel_type_id:form.fuel_type_id,
      policy_date:form.policy_date,rto:form.rto.trim(),vehicle_make:form.vehicle_make.trim(),
      ...(form.capacity_id?{capacity_id:readNumber(form.capacity_id)}:{}),
      ...(amount(form.capacity_value)!==undefined?{capacity_value:amount(form.capacity_value)}:{}),
      ...(amount(form.vehicle_age)!==undefined?{vehicle_age:amount(form.vehicle_age)}:{}),
      ...(amount(form.ncb)!==undefined?{ncb:amount(form.ncb)}:{}),
      ...(form.model.trim()?{model:form.model.trim()}:{}),
      premium:{...(amount(form.gwp)!==undefined?{gwp:amount(form.gwp)}:{}),...(amount(form.odPremium)!==undefined?{odPremium:amount(form.odPremium)}:{}),...(amount(form.tpPremium)!==undefined?{tpPremium:amount(form.tpPremium)}:{})},
      business_metrics:{...(amount(form.monthlyGwp)!==undefined?{monthlyGwp:amount(form.monthlyGwp)}:{})}
    };
    const extraPayload:Record<string,unknown>={};
    for(const [key,value] of Object.entries(extra)){
      if(value.trim()==='')continue;
      const definition=dynamic.find(([field])=>field===key)?.[1].def;
      const v=definition?.type==='boolean'?value==='true':definition?.type==='number'?Number(value):value;
      if(key.startsWith('businessMetrics.')) (payload.business_metrics as any)[key.split('.')[1]]=v;
      else if(key.startsWith('premium.')) (payload.premium as any)[key.split('.')[1]]=v;
      else extraPayload[key]=v;
    }
    if(Object.keys(extraPayload).length) payload.additional_fields=extraPayload;
    return payload;
  };

  async function validateOnly(){setLoading(true);try{
    const response=await api<any>('/api/v1/motor/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(build())});
    setErrors([]);setWarnings(response.warnings||[]);notify('Vehicle and policy inputs validated.');
  }catch(e:any){const body=e instanceof ApiError?e.body:null;setErrors(body?.errors||[{field:'body',code:'ERROR',message:e.message}]);setWarnings(body?.warnings||[]);notify('Please correct the highlighted input fields.');}finally{setLoading(false)}}

  async function compare(){setLoading(true);setWarnings([]);setErrors([]);setResults(null);try{
    const response=await api<any>('/api/v1/motor/compare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(build())});
    setWarnings(response.warnings||[]);setResults(response.data);notify('Payout comparison completed for all available insurers.');
  }catch(e:any){const body=e instanceof ApiError?e.body:null;setErrors(body?.errors||[{field:'body',code:'API_ERROR',message:body?.message||e.message}]);setWarnings(body?.warnings||[]);notify('Unable to compare. Review the validation messages.');}finally{setLoading(false)}}

  const rows=useMemo(()=>{
    const search=filter.toLowerCase().trim();
    const all=(results?.results||[]).filter(r=>(!matchedOnly||r.status==='MATCHED')&&(!search||`${r.companyName} ${r.companyCode} ${r.status} ${r.ruleCode}`.toLowerCase().includes(search)));
    const score=(r:ComparisonResult)=>r.commissionAmount??r.percentage??-1;
    return all.sort((a,b)=>sort==='insurer'?String(a.companyName||'').localeCompare(String(b.companyName||'')):sort==='asc'?score(a)-score(b):score(b)-score(a));
  },[results,filter,matchedOnly,sort]);

  return <div className="stack motorExperience">
    <section className="card payoutSearchCard">
      <div className="sectionTitle"><Calculator size={26}/><div><h2>Find Motor Payout</h2><p>Choose your policy and vehicle. The form asks only for fields applicable to your motor type.</p></div></div>
      <div className="accuracyNote"><ShieldCheck size={19}/><div><b>Source-backed results</b><span>All available insurers are checked. Percentages appear only where the underlying grid provides a matching rule.</span></div></div>
      {loadError&&<div className="alert danger"><AlertCircle size={16}/>{loadError}. Verify the backend is running.</div>}
      <div className="motorFormGroup"><h3>Policy & vehicle</h3><div className="compactInputs">
        <Entry label="Policy Type" required issue={err('policy_type_id')}><select value={form.policy_type_id} onChange={e=>update('policy_type_id',Number(e.target.value))}>{catalog?.policyTypes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Entry>
        <Entry label="Motor Type" required issue={err('motor_type_id')}><select value={form.motor_type_id} onChange={e=>{setForm(f=>({...f,motor_type_id:Number(e.target.value),capacity_id:'',capacity_value:'',vehicle_age:''}));setResults(null);setExtra({});setErrors([])}}>{catalog?.motorTypes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Entry>
        <Entry label="Fuel Type" required issue={err('fuel_type_id')}><select value={form.fuel_type_id} onChange={e=>{setForm(f=>({...f,fuel_type_id:Number(e.target.value),capacity_id:'',capacity_value:''}));setResults(null);setExtra({})}}>{catalog?.fuelTypes.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Entry>
        <Entry label="Policy Date" required issue={err('policy_date')}><input type="date" value={form.policy_date} onChange={e=>update('policy_date',e.target.value)}/></Entry>
        <Entry label="RTO" required issue={err('rto')} help="Example: MH-01, AP-21"><input placeholder="MH-01" value={form.rto} onChange={e=>update('rto',e.target.value.toUpperCase())}/></Entry>
        <Entry label="Vehicle Make" required issue={err('vehicle_make')}><input placeholder="TATA, HONDA, HYUNDAI…" value={form.vehicle_make} onChange={e=>update('vehicle_make',e.target.value.toUpperCase())}/></Entry>
        {(config?.vehicleAgeRequired||form.vehicle_age!=='')&&<Entry label="Vehicle Age (years)" required={config?.vehicleAgeRequired} issue={err('vehicle_age')}><input type="number" min="0" max="100" step="1" value={form.vehicle_age} onChange={e=>update('vehicle_age',e.target.value)}/></Entry>}
        {config?.capacityRequired&&<Entry label={capLabel} required issue={err('capacity_value')} help="Enter the actual numeric capacity for accurate source-grid matching."><input type="number" min="0" step="any" value={form.capacity_value} onChange={e=>update('capacity_value',e.target.value)}/></Entry>}
        {config?.capacityRequired&&<Entry label="Capacity Band (optional)" issue={err('capacity_id')} help="Overlapping labels are shown for reference; raw capacity controls matching."><select value={form.capacity_id} onChange={e=>update('capacity_id',e.target.value)}><option value="">Auto / use raw capacity</option>{config.capacityOptions.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></Entry>}
        <Entry label="NCB %" issue={err('ncb')}><input type="number" min="0" max="100" value={form.ncb} onChange={e=>update('ncb',e.target.value)}/></Entry>
      </div></div>
      <button className="motorAdvancedToggle" type="button" onClick={()=>setShowAdvanced(s=>!s)} aria-expanded={showAdvanced}>{showAdvanced?'Hide optional details':'Show optional premium and business details'} <span>{showAdvanced?'−':'+'}</span></button>
      {showAdvanced&&<div className="motorFormGroup"><div className="compactInputs">
        <Entry label="Vehicle Model"><input value={form.model} onChange={e=>update('model',e.target.value)} placeholder="Model" /></Entry>
        <Entry label="Policy GWP (₹)"><input type="number" min="0" value={form.gwp} onChange={e=>update('gwp',e.target.value)}/></Entry>
        <Entry label="OD Premium (₹)"><input type="number" min="0" value={form.odPremium} onChange={e=>update('odPremium',e.target.value)}/></Entry>
        <Entry label="TP Premium (₹)"><input type="number" min="0" value={form.tpPremium} onChange={e=>update('tpPremium',e.target.value)}/></Entry>
        <Entry label="Monthly Business GWP (₹)"><input type="number" min="0" value={form.monthlyGwp} onChange={e=>update('monthlyGwp',e.target.value)}/></Entry>
      </div></div>}
      {warnings.length>0&&<div className="motorIssues motorWarning"><b>Validation notes</b>{warnings.map((x,i)=><p key={i}>{x.message}</p>)}</div>}
      {errors.length>0&&<div role="alert" className="motorIssues motorError"><b>Correct the following</b>{errors.map((x,i)=><p key={i}>{x.field}: {x.message}</p>)}</div>}
      <div className="motorActions"><button className="primary" onClick={compare} disabled={loading||!catalog}><Calculator size={17}/>{loading?'Calculating…':'Fetch Payouts'}</button><button onClick={validateOnly} disabled={loading||!catalog}><ClipboardCheck size={17}/>Validate Inputs</button><a className="motorApiLink" href={`${API_BASE}/api-docs/`} target="_blank" rel="noopener noreferrer">Developer API Docs <ExternalLink size={15}/></a></div>
    </section>
    {dynamic.length>0&&<section className="card additionalCard"><h2>Additional information requested by insurers</h2><p className="motorHelper">These fields are required by source rules for the current vehicle, not by every insurer.</p><div className="compactInputs">{dynamic.map(([field,{def,insurers}])=><Entry key={field} label={def.label||field} help={[...insurers].join(', ')}><>
      {def.options?.length?<select value={extra[field]||''} onChange={e=>setExtra(x=>({...x,[field]:e.target.value}))}><option value="">Select</option>{def.options.map((o:any,i:number)=>{const v=typeof o==='object'&&o!==null&&'value'in o?o.value:o;const label=typeof o==='object'&&o!==null&&'label'in o?o.label:String(v);return <option key={i} value={String(v)}>{label}</option>})}</select>:def.type==='boolean'?<select value={extra[field]||''} onChange={e=>setExtra(x=>({...x,[field]:e.target.value}))}><option value="">Select</option><option value="true">Yes</option><option value="false">No</option></select>:<input type={def.type==='number'?'number':'text'} value={extra[field]||''} onChange={e=>setExtra(x=>({...x,[field]:e.target.value}))}/>}</>
    </Entry>)}</div><button className="primary" disabled={loading} onClick={compare}>Recalculate all insurers</button></section>}
    {results&&<>
      {results.results?.length && results.results.every(r=>['NO_ACTIVE_GRID','NO_GRID'].includes(r.status||'')) && <div className="motorIssues motorWarning"><b>No active grids for this policy date</b><p>Check whether the insurer package effective dates include {form.policy_date}. Historical September grids should not automatically be applied to October policies.</p></div>}
      <div className="summaryStrip"><div><span>Insurers Checked</span><b>{results.insurersChecked||results.results?.length||0}</b></div><div><span>Matched</span><b>{results.matchedInsurers||0}</b></div><div><span>Need More Input</span><b>{results.needsInput||0}</b></div><div><span>Best Payout</span><b>{typeof results.bestPayout?.commissionAmount==='number'?`₹${results.bestPayout.commissionAmount.toLocaleString('en-IN')}`:typeof results.bestPayout?.percentage==='number'?`${results.bestPayout.percentage}%`:'—'}</b><small>{results.bestPayout?.companyName||''}</small></div></div>
      <section className="card"><div className="toolbar"><div><h2>Insurer Payout Results</h2><p>Showing {rows.length} of {results.results?.length||0}. Companies without a match are included.</p></div><Filter size={19}/></div>
        <div className="motorResultFilters"><div className="searchBox"><Search size={17}/><input placeholder="Search company or status" value={filter} onChange={e=>setFilter(e.target.value)}/></div><select aria-label="Sort insurer results" value={sort} onChange={e=>setSort(e.target.value)}><option value="payout">Payout: high to low</option><option value="asc">Payout: low to high</option><option value="insurer">Company name</option></select><label className="filterCheck"><input type="checkbox" checked={matchedOnly} onChange={e=>setMatchedOnly(e.target.checked)}/> Matched only</label></div>
        <div className="payoutGrid">{rows.map((r,i)=><ResultCard key={`${r.companyCode}-${i}`} r={r}/>)}</div>{rows.length===0&&<p className="empty">No insurers match the current result filters.</p>}
        <p className="motorHelper">Statuses are supplied by the deterministic rule engine. A non-match is not a zero-percent payout. Check each matched card’s Verified Source before commercial use.</p>
      </section>
    </>}
    {catalog&&<div className="motorFootNote"><CheckCircle2 size={16}/> {catalog.policyTypes.length} policy types · {catalog.motorTypes.length} motor types · {catalog.fuelTypes.length} fuel choices · {catalog.capacities.length} capacity labels. <span>Current selection: {motor?.label||'—'} · {fuel?.label||'—'} · {statusLabel('MATCHED')}</span></div>}
  </div>;
}
