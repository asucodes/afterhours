import {z} from 'zod';
export class ModelOutputError extends Error{constructor(){super('The model could not produce a valid response after a repair attempt. Your request and saved research are safe. Please retry.');this.name='ModelOutputError';}}
export function validationDetails(error:unknown){return error instanceof z.ZodError?error.issues.map(i=>({field:i.path.join('.')||'request',message:i.message})):[];}
export function apiError(error:unknown){
 if(error instanceof z.ZodError){const fields=validationDetails(error);return {status:400,body:{code:'INVALID_INPUT',error:fields.map(i=>`${i.field}: ${i.message}`).join(' '),fields}};}
 if(error instanceof ModelOutputError)return {status:502,body:{code:'MODEL_OUTPUT_INVALID',error:error.message}};
 return {status:500,body:{error:error instanceof Error?error.message:'The request failed. Please retry.'}};
}
