#!/usr/bin/env node
/** Node CLI for Diacritic Bloom. Standard library only. All output is UTF-8. */
import {readFileSync} from 'node:fs';
import {encode,decode,specimen,pack,unpack} from './bloom.mjs';
const HELP=`Diacritic Bloom v1

Read text from standard input. No newline is added to transformed output.
  node cli.mjs encode [--font fraktur] [--seed 42] [--above 2] [--overlay 1] [--below 1]
                     [--mode single|cycle-letter|cycle-word|random-letter] [--strict] [--frame]
  node cli.mjs decode [--keep-frame] [--strict-output]
  node cli.mjs pack   [same options as encode]
  node cli.mjs unpack [--field source|encoded|settings]
  node cli.mjs specimen [--frame]

Examples:
  printf 'the diacritics are now free' | node cli.mjs encode --font fraktur --seed 42
  node cli.mjs decode < bloom.txt
  node cli.mjs specimen > exact-original.txt
  node cli.mjs unpack --field source < bloom-recipe.json
`;
try {
  const [command,...args]=process.argv.slice(2);
  if (!command || ['help','--help','-h'].includes(command)) {process.stdout.write(HELP);process.exit(0);}
  if (!['encode','decode','pack','unpack','specimen'].includes(command)) throw new Error(`Unknown command: ${command}`);
  const accepted={encode:['font','seed','above','overlay','below','mode','strict','frame'],
    pack:['font','seed','above','overlay','below','mode','strict','frame'],
    decode:['keep-frame','strict-output'],unpack:['field'],specimen:['frame']}[command];
  const flags={};
  for(let i=0;i<args.length;i++){
    if(!args[i].startsWith('--')) throw new Error(`Unexpected argument: ${args[i]}`);
    const key=args[i].slice(2);
    if(!accepted.includes(key))throw new Error(`Unsupported option for ${command}: --${key}`);
    if(Object.hasOwn(flags,key))throw new Error(`Duplicate option: --${key}`);
    if(['strict','frame','keep-frame','strict-output'].includes(key)){flags[key]=true;continue;}
    if(i+1>=args.length || args[i+1].startsWith('--'))throw new Error(`Missing value for --${key}`);
    const value=args[++i];flags[key]=['seed','above','overlay','below'].includes(key)?Number(value):value;
  }
  // Fatal UTF-8 decoding avoids silently replacing invalid input bytes with U+FFFD.
  const source=command==='specimen'?'':new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(0));
  let out;
  if(command==='encode')out=encode(source,flags);
  if(command==='decode')out=decode(source,{stripFrame:!flags['keep-frame'],strictOutput:!!flags['strict-output']});
  if(command==='pack')out=JSON.stringify(pack(source,flags),null,2)+'\n';
  if(command==='unpack'){
    const packet=unpack(source),field=flags.field??'source';
    if(!['source','encoded','settings'].includes(field))throw new Error('field must be source, encoded or settings.');
    out=field==='settings'?JSON.stringify(packet.settings,null,2)+'\n':packet[field];
  }
  if(command==='specimen')out=specimen(flags);
  process.stdout.write(out);
} catch(error) {process.stderr.write(`Bloom: ${error.message}\n`);process.exitCode=1;}
