let Stys=require("Styles")
let Packer=require("plugin/Packer")

function MapMeta(){
    this.id=0;
    this.name="";
    this.mapName="";
    this.author="";
    this.desc="";
    this.tags=[];
}

function PluginMeta(){
    this.id=0;
    this.name="";
    this.pluginName="";
    this.author="";
    this.desc="";
    this.tags=[];
}


module.exports={
    load:false,

    version:"1.1.1",
    versionType:"c",
    /**
     * c:public
     * d:protected
     * e:private
     */
    connected:false,
    connectData:{},
    votes:[],
    pvpProtect:0,
    gameoverTimer:0,
    gameoverMessage:"--message--",




    windows:[],
    activeWindow:null,
    maximizeWindows:[],
    scale:()=>(Core.settings.getInt("uiscale",100)/100-1)*1.5+1,
    width:()=>Core.scene.getWidth(),
    height:()=>Core.scene.getHeight(),
    widthX:function(){return this.width()*this.scale()},
    heightX:function(){return this.height()*this.scale()},
    addWindow:function(win){
        this.windows.push(win);
    },
    removeWindow:function(win){

        if(this.activeWindow==win) this.activeWindow=null;
        if(this.maximizeWindows.includes(win)){
            this.maximizeWindows.splice(this.maximizeWindows.indexOf(win),1);
        }
        var index=this.windows.indexOf(win);
        if(index>=0){
            this.windows.splice(index,1);
        }
        if(this.top==win){
            this.top=null;
        }
    },
    events:{
        eventsObj:{},
        eventsObjId:{},
        eid:0,
        on:function(event,callback){
            if(!this.eventsObj[event]){
                this.eventsObj[event]=[];
            }
            if(!this.eventsObjId[event]){
                this.eventsObjId[event]=[];
            }
            this.eventsObj[event].push(callback);
            this.eventsObjId[event].push(this.eid);
            let that=this;
            return {
                id:that.eid++,
                cancel(){
                    if(that.eventsObjId[event].indexOf(this.id)!=-1){
                        that.eventsObj[event].splice(that.eventsObjId[event].indexOf(this.id),1);
                        that.eventsObjId[event].splice(that.eventsObjId[event].indexOf(this.id),1);
                    }
                }
            }
        },
        fire:function(event){
            if(!module.exports.load) return;
            let args=Array.from(arguments).slice(1);
            Core.app.post(()=>{
                if(this.eventsObj[event]){
                    for(var i=0;i<this.eventsObj[event].length;i++){
                        this.eventsObj[event][i].apply(null,args);
                    }
                }
            })
        }
    },

    openFileMethods:{},
    openFile:function(fullPath){
        let ext=fullPath.split(".").pop();
        if(this.openFileMethods[ext]){
            this.openFileMethods[ext]("path",fullPath);
        }
    },

    fileClipboard:[],
    fileClipboardType:"",

    positionSelectior:null,

    acDir:null,
    tempDir:null,
    pluginDir:null,

    plugins:{
        plugins:[],
        tempPlugins:[],
        pluginsFi:{},
        load(){
            this.plugins.forEach(a=>{
                if(!a.tags[1])this.loadPlugin(a)
            })
        },
        loadStyles(){
            for(let fi of this.dir.list()){
                let plug=Packer.unpack(fi.readBytes())
                this.pluginsFi[plug.GUID]=fi
                this.plugins.push(plug);
            }
            this.plugins.forEach(a=>{
                if(a.tags[1])this.loadPlugin(a)
            })
        },
        init(){
            this.exports={
                Window:require("Window"),
                Manager:module.exports,
                MainWindow:require("MainWindow"),
                Stys:Stys,
                Packer:Packer,
                BlockSelector:require("selectors/BlockSelector"),
                ItemSelector:require("selectors/ItemSelector"),
                LiquidSelector:require("selectors/LiquidSelector"),
                FileSelector:require("selectors/FileSelector"),
                MapSelector:require("selectors/MapSelector"),
                ObjectSelector:require("selectors/ObjectSelector"),
                TeamSelector:require("selectors/TeamSelector"),
                UnitSelector:require("selectors/UnitSelector"),
                Position:require("selectors/Position"),
                FileIcons:require("selectors/FileIcons"),
                Selectors:require("selectors/Selectors"),
                MapMeta:MapMeta,
                PluginMeta:PluginMeta
            }
            Vars.mods.scripts.runConsole("var Manager=require('Manager');var requireR=require")
            Vars.mods.scripts.runConsole("for(let name in Manager.plugins.exports){this[name]=Manager.plugins.exports[name]}")
        },
        run(script,file){
            try{
                let context=Vars.mods.scripts.context;
                let scope=Vars.mods.scripts.scope;
                context.evaluateString(scope,"modName = \"[ACPLUGIN]\"\nscriptName = \""+file+"\"","initScript.js",1);
                module.exports.module={exports:{}}
                context.evaluateString(scope,"(function(){\'use strict\';var module=Manager.module;var exports=module.exports;var require=Manager.plugins.require;\n"+script+"})()",file,1);
                return module.exports.module.exports;
            }catch(e){
                Log.log(Log.LogLevel.err,file+": "+e)
            }
        },
        dir:null,
        currentLoad:null,
        loadPlugin(plugin){
            this.currentLoad=plugin
            Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"start load")
            if(plugin.bundleDir!=""&&Core.settings.get("ac-plugin-"+plugin.GUID+"-disabled","false")=="false"){
                Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"load bundles")
                let dir=plugin.files
                for(let p of plugin.bundleDir.split("/")){
                    dir=dir[p]
                    Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"cd "+p)
                }
                let countryCode=Core.bundle.getLocale().getCountry();
                let languageCode=Core.bundle.getLocale().getLanguage();
                let name=countryCode+"_"+languageCode;
                if(!dir[name]){
                    name="bundle"
                }else{
                    name="bundle_"+name;
                }
                name+=".properties";
                Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"code="+name)
                let file=dir[name];
                if(file){
                    let str=new java.lang.String(file,"UTF-8")+"";
                    Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"read file")
                    let p=Core.bundle.getPrototies()
                    let lines=str.split("\n");
                    for(let line of lines){
                        let key=line.split("=")[0];
                        let value=line.replace(key+"=","");
                        Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"add "+line)
                        p.put(key,value);
                    }
                }
            }
            if(plugin.mainFilePath!=""&&Core.settings.get("ac-plugin-"+plugin.GUID+"-disabled","false")=="false"){
                Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"load script")
                this.currentLoad=plugin;
                let dir=plugin.files
                for(let p of plugin.mainFilePath.split("/")){
                    dir=dir[p]
                    Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"cd "+p)
                }
                Log.log(Log.LogLevel.info,"[ACPL]"+plugin.name+":"+"result:"+this.run(new java.lang.String(dir,"UTF-8")+"",plugin.mainFilePath))
            }
        },
        loadedModules:{},
        require(moduleName){
            let path=moduleName.split("/");
            let that=require("Manager").plugins
            that.temp=that.plugins
            let at=path[0].includes(":")?path[0].split(":")[0]:that.currentLoad.GUID;
            path[0]=path[0].replace(at+":","");
            if(that.loadedModules[at]&&that.loadedModules[at][path.join("/")]){
                return that.loadedModules[at][path.join("/")];
            }
            let plugin;
            for(let a of require("Manager").plugins.plugins){
                if(a?a.GUID==at:false){
                    plugin=a
                    break
                }
            }
            if(!plugin){
                throw new Error("Plugin not found: "+at);
            }
            let file=plugin.files
            for(let i=0;i<path.length;i++){
                file=file[path[i]]
                if(!file){
                    throw new Error("Module not found: "+path.join("/"));
                }
            }
            if(file.length==undefined){
                throw new Error("Module not found: "+path.join("/"));
            }
            let str=new java.lang.String(file,"UTF-8");
            let mod=that.run(str,at+":"+path.join("/"));
            if(!that.loadedModules[at]){
                that.loadedModules[at]={};
            }
            that.loadedModules[at][path.join("/")]=mod;
            return mod
        },
        delete(plugin){
            try{
                this.pluginsFi[plugin.GUID].delete()
                delete this.pluginsFi[plugin.GUID]
            }catch(e){}
        },
        import(fi){
            let plug=Packer.unpack(fi.readBytes())
            this.tempPlugins.push(plug)
            this.dir.child(plug.GUID+".acpl").writeBytes(fi.readBytes())
            this.pluginsFi[plug.GUID]=this.dir.child(plug.GUID+".acpl")
        }
    },
    styles:{
        load(){
            let currentStyle=Core.settings.get("aimclient-style","aimclient");
            let style=this.styles[currentStyle];
            if(!style){
                style=this.defaultStyle
            }else{
                style=Object.assign({},this.defaultStyle,style);
            }
            for(let i in style){
                Stys[i]=style[i];
            }

            Stys.di=Stys.defaulti
            Stys.dt=Stys.defaultt
            Stys.is=Stys.togglei
            Stys.it=Stys.togglet
        },
        changeStyle(name){
            Core.settings.put("aimclient-style",name);
            this.load();
        },
        registerStyle:function(name,style){
            this.styles[name]=style;
        },
        styles:{},
        defaultStyle:{
            defaulti:Styles.defaulti,
            defaultt:Styles.defaultt,
            togglei:Styles.clearTogglei,
            togglet:Styles.togglet,

            button:Tex.button,
            buttonNoBackground:Tex.button,

            textField:Styles.defaultField,
            area:Styles.areaField,
            check:Styles.defaultCheck,
            slider:Styles.defaultSlider,
            bar:Bar,

            themeColor:Color.orange,
        }
    },
    sources:{
        maps:{
            /**
             * @returns {string}
             */
            getDefaultSource(){
                let first=this.sources[0]
                if(first==undefined) return null
                return first
            },
            /**
             * @param {string} name
             * @returns {MapSource}
             */
            get(name){
                return this.sources.filter(a=>a.toString()==name).shift()
            },
            dir:null,
            sources:[],
            fn:[],
            add(str){
                let that=module.exports.sources.maps
                Vars.mods.scripts.runConsole("Manager.sources.maps.csr="+str)
                let obj=that.csr
                obj.str=str
                obj.type="map"
                that.sources.push(obj)
                that.dir.child(obj.GUID+".acms").writeString(str)
            },
            change(name,str){
                let that=module.exports.sources.maps
                let id=that.sources.map(a=>a.toString()==name).indexOf(true)
                Vars.mods.scripts.runConsole("Manager.sources.maps.csr="+str)
                let obj=that.csr
                obj.str=str
                obj.type="map"
                that.sources[id]=obj
                that.dir.child(obj.GUID+".acms").writeString(str)
            },
            delete(name){
                let that=module.exports.sources.maps
                let id=that.sources.map(a=>a.toString()==name).indexOf(true)
                let obj=that.sources[id]
                that.dir.child(obj.GUID+".acms").delete()
                that.sources.splice(id,1)
            },
            init(){
                for(let fi of this.dir.list()){
                    let str=fi.readString()
                    Vars.mods.scripts.runConsole("Manager.sources.maps.csr="+str)
                    let obj=this.csr
                    obj.str=str
                    obj.type="map"
                    this.sources.push(obj)
                }
            }
        },
        plugins:{
            /**
             * @returns {string}
             */
            getDefaultSource(){
                let first=this.sources[0]
                if(first==undefined) return null
                return first
            },
            /**
             * @param {string} name
             * @returns {PluginSource}
             */
            get(name){
                return this.sources.filter(a=>a.toString()==name).shift()
            },
            dir:null,
            sources:[],
            add(str){
                Vars.mods.scripts.runConsole("Manager.sources.plugins.csr="+str)
                let obj=this.csr
                obj.str=str
                obj.type="plugin"
                this.sources.push(obj)
                this.dir.child(obj.GUID+".acps").writeString(str)
            },
            change(name,str){
                let that=module.exports.sources.plugins
                let id=that.sources.map(a=>a.toString()==name).indexOf(true)
                Vars.mods.scripts.runConsole("Manager.sources.plugins.csr="+str)
                let obj=that.csr
                obj.str=str
                obj.type="plugin"
                that.sources[id]=obj
                that.dir.child(obj.GUID+".acps").writeString(str)
            },
            delete(name){
                let that=module.exports.sources.plugins
                let id=that.sources.map(a=>a.toString()==name).indexOf(true)
                let obj=that.sources[id]
                that.dir.child(obj.GUID+".acps").delete()
                that.sources.splice(id,1)
            },
            init(){
                for(let fi of this.dir.list()){
                    let str=fi.readString()
                    Vars.mods.scripts.runConsole("Manager.sources.plugins.csr="+str)
                    let obj=this.csr
                    obj.str=str
                    obj.type="plugin"
                    this.sources.push(obj)
                }
            }
        },
        dir:null,
        init(){
            if(Core.settings.get("ac-defaultSourceAdded","false")=="false"){
                let fi=Vars.mods.getMod("aimclient").root
                if(!fi.child("assets").exists()) fi=fi.child("aimClient")
                fi=fi.child("assets").child("sources")
                if(fi.exists()){
                    this.maps.dir.child("CIG-Potato.acms").writeString(fi.child("maps.acms").readString())
                    this.plugins.dir.child("CIG-Potato.acps").writeString(fi.child("plugins.acps").readString())
                }else{
                    let d=new Dialog("Oh no!")
                    let b=d.cont
                    b.area(Core.bundle.get("canNotImportDefaultSource"),cons(a=>{})).size(512,128).row()
                    b.button("@ok",run(()=>{
                        d.hide()
                    })).size(512,32)
                    d.show()
                }
                Core.settings.put("ac-defaultSourceAdded","true")
            }

            this.maps.init()
            this.plugins.init()
        }
    }
}
