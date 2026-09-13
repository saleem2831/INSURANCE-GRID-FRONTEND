export const PRODUCT_OPTIONS = [
  { value:'PRIVATE_CAR', label:'Private Car' },
  { value:'PCV', label:'Passenger Carrying Vehicle' },
  { value:'GCV', label:'Goods Carrying Vehicle' },
  { value:'TWO_WHEELER', label:'Two Wheeler' }
];

export const STATUS_LABELS: Record<string,string> = {
  MATCHED:'Matched', NEEDS_INPUT:'More input required', NO_MATCH:'Not matched', NO_RULES:'Not applicable', NO_GRID:'No active grid',
  NO_RTO_MAPPING:'RTO mapping unavailable', DECLINE:'Decline', NO_BUSINESS:'No business', IRDA:'IRDA', COUNCIL_CALL:'Council call', MANUAL_REVIEW:'Manual review'
};
