import {crust,crustSchemas} from '../server/providers';
const params={search:{query:'PKI consulting incident response services India',mode:'hybrid'},limit:2,fields:['crustdata_company_id','basic_info','locations']};
await crust('company_search',params);let cached=false;await crust('company_search',params,()=>{cached=true;});await crustSchemas();console.log(JSON.stringify({providerSearch:'completed',repeatUsedCache:cached,schema:'completed'}));process.exit(0);
