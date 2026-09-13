export type Insurer = { _id?: string; code: string; name: string; active?: boolean };
export type FieldOption = { value: string | number | boolean; label: string };
export type FieldDefinition = { field: string; label: string; type: 'text'|'number'|'select'|'boolean'|'date'; placeholder?: string; options?: FieldOption[] };
export type InputSchema = { product: string; context: FieldDefinition[]; required: FieldDefinition[]; note?: string };
export type PreviewData = { importId?:string; duplicate?:boolean; fileExists?:boolean; message?:string; existingImportId?:string; action?:'CREATE'|'REPLACE'|'DUPLICATE'|string; parser?:string; parserProfileId?:string; canCommit?:boolean; detected?:{rules?:number;rtoMappings?:number}; warnings?:string[]; errors?:string[]; rulePreview?:unknown[]; rtoMappingPreview?:unknown[]; logicalKey?:string };
export type UploadedFile = { _id:string; fileName:string; fileHash?:string; version?:string; logicalKey?:string; action?:string; status?:string; rulesImported?:number; rulesDetected?:number; rtoMappingsImported?:number; rtoMappingsDetected?:number; fileAvailable?:boolean; createdAt?:string; insuranceCompanyId?:{code?:string;name?:string} };
export type MissingField = { field:string; label?:string; type?:string; options?:any[]; requiredByRules?:string[] };
export type ComparisonResult = {
  companyCode?:string; companyName?:string; status?:string; displayStatus?:string; percentage?:number|null; basis?:string|null; basisAmount?:number|null; commissionAmount?:number|null;
  ruleCode?:string; matchedCluster?:string|null; reason?:string; message?:string; gridVersion?:string; logicalKey?:string;
  missingFields?:MissingField[]; basePercentage?:number|null; baseRuleCode?:string;
  source?:{fileName?:string;sheet?:string;row?:number;column?:string;originalText?:string};
  percentageAudit?:{sourceText?:string|null;sheet?:string|null;row?:number|null;column?:string|null;fileName?:string|null};
  percentageDisplay?:string|null;
  payoutComponents?:Array<{basis:string;percentage:number;basisAmount?:number|null;commissionAmount?:number|null}>;
  percentageComponents?:{base?:number;incremental?:number;final?:number;aggregation?:string;adjustmentRuleCode?:string|null;adjustmentSource?:any};
  derivations?:Array<{ruleCode?:string;field?:string;value?:unknown;source?:any}>; derivedContext?:Record<string,unknown>;
  resolvedInputs?:Record<string,unknown>; rtoContext?:Record<string,unknown>; activeGridFiles?:string[];
};
export type ComparisonData = { insurersChecked?:number; matchedInsurers?:number; needsInput?:number; filteredCount?:number; bestOffer?:ComparisonResult|null; bestPayout?:ComparisonResult|null; results?:ComparisonResult[]; inputValidation?:any };

export type GridDocumentRole =
  | 'PAYOUT_GRID' | 'PRODUCT_GRID' | 'RTO_MASTER' | 'CLUSTER_MASTER'
  | 'INCREMENTAL_GRID' | 'EXCLUSION_GRID' | 'GUIDELINES' | 'LOOKUP_MASTER' | 'REFERENCE_DOCUMENT';

export type GridPackageDocument = {
  id: string; fileName: string; relativePath?: string; fileType?: string; role: GridDocumentRole;
  productScope?: string[]; required?: boolean; parser?: string; status?: string; sheetNames?: string[];
  rulesDetected?: number; rtoMappingsDetected?: number; warnings?: string[]; errors?: string[]; preview?: any;
};

export type GridPackagePreview = {
  packageId?: string; duplicate?: boolean; action?: string; message?: string; name?: string; version?: string;
  status?: string; effectiveFrom?: string; effectiveTo?: string; sourceType?: string; totalDocuments?: number;
  totalRules?: number; totalRtoMappings?: number; productCoverage?: string[]; warnings?: string[]; errors?: string[];
  validationSummary?: any; canCommit?: boolean; documents?: GridPackageDocument[];
};

export type GridPackageRow = GridPackagePreview & {
  _id: string; createdAt?: string; insuranceCompanyId?: { code?: string; name?: string; shortName?: string; active?: boolean };
  gridId?: string | null;
};
