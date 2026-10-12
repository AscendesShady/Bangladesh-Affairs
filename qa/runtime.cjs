// Use a normal Playwright installation when available, or the desktop bundle.
try{module.exports=require('playwright');}
catch(error){
  if(error.code!=='MODULE_NOT_FOUND')throw error;
  const path=require('node:path'),os=require('node:os');
  module.exports=require(path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','playwright'));
}
