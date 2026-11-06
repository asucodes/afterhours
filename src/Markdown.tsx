import {useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {Check,Copy,FileText,Code2} from 'lucide-react';

export function Markdown({text,compact=false}:{text:string;compact?:boolean}){
 return <div className={`markdown ${compact?'markdown-compact':''}`}><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={url=>/^(https?:\/\/|mailto:|#)/i.test(url)?url:''} components={{
  a:({node,...props})=><a {...props} target="_blank" rel="noopener noreferrer"/>,
  table:({node,...props})=><div className="markdown-table-scroll"><table {...props}/></div>,
  img:({src,alt})=><a href={typeof src==='string'?src:undefined} target="_blank" rel="noopener noreferrer">{alt||'View linked image'}</a>,
 }}>{text}</ReactMarkdown></div>;
}
export function DocumentViewer({text}:{text:string}){
 const [source,setSource]=useState(false),[copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(text);setCopied(true);setCopyError(false);setTimeout(()=>setCopied(false),2000);}catch{setCopyError(true);}}
 return <div className="document-viewer"><div className="document-toolbar"><div className="document-view-tabs"><button className={!source?'active':''} onClick={()=>setSource(false)}><FileText size={13}/> Preview</button><button className={source?'active':''} onClick={()=>setSource(true)}><Code2 size={13}/> Markdown</button></div><button onClick={copy} className="document-copy">{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Copied':copyError?'Copy unavailable':'Copy'}</button></div>{source?<pre className="markdown-source">{text}</pre>:<Markdown text={text}/>}</div>;
}
