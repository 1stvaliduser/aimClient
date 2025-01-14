const Manager = require("./Manager");
let Stys = require("Styles")
let Marks=require("Marks")
/**
 * [MOVE] [AIMCLIENT] [WINDOWS] [INFOS] [<]
 * ========================================
 * |menu       |infos                     |
 * |           |                          |
 * |           |                          |
 * |           |                          |
 * ========================================
 * |votes      |
 * |           |
 * |           |
 * |           |
 * =============
 */




/**
 * TODO:
 * width height limit
 */
module.exports={
    init(){
        this.x=+Core.settings.get("aimclient-mainwindow-x",(48*3+324).toString());
        this.y=+Core.settings.get("aimclient-mainwindow-y","400");
        let that=this;
        this.s=true;
        this.table.table(cons(t=>{
            let c,c1
            let s=t.table(Stys.button,cons(t=>{
                let b=t.button("<",Stys.dt,run(()=>{
                    that.s=!that.s;
                    that.buttons.visible=that.s;
                    if(that.s){
                        s.size(48*3+24,48)
                        c.size(48*3,48)
                        c1.size(0,0)
                    }else{
                        s.size(24,48)
                        c.size(0,0)
                        c1.size(48*3,48)
                    }
                    b.setText(that.s?"<":">");
                })).size(24,48).get()
                c=t.table(cons(t=>{
                    let lastX=0;
                    let lastY=0;
                    let b=t.button(Core.atlas.drawable("aimclient-moveBig"),Stys.di,run(()=>{})).size(48,48);
                    b.get().resizeImage(32);
                    b.get().addListener(extend(InputListener,{
                        touchDown(event,x,y,pointer,button){
                            lastX=x;
                            lastY=y;
                            return true;
                        },
                        touchUp(event,x,y,pointer,button){
                            let mx=x-lastX;
                            let my=y-lastY;
                            that.x+=mx;
                            that.y+=my;
                            Core.settings.put("aimclient-mainwindow-x",that.x.toString());
                            Core.settings.put("aimclient-mainwindow-y",that.y.toString());
                        }
                    }));

                    t.button(Core.atlas.drawable("aimclient-icon"),Stys.di,run(()=>{
                        that.showMenu(true);
                    })).size(48,48).get().resizeImage(32)
                    t.button(Core.atlas.drawable("aimclient-windowsBig"),Stys.di,run(()=>{
                        that.showMenu(false);
                        try{
                            that.jumpTo("main.windows");
                        }catch(e){}
                    })).size(48,48).get().resizeImage(32);
                })).size(48*3,48);
                that.buttons=c.get()
                // t.table(Tex.button).size(48*3,48).get().visibility=boolp(()=>!s)
            })).size(48*3+24,48).right();
            c1=t.table().size(0,0)
            // this.table.table().size(280,48).right();
        })).size(48*4,48).left()
        this.table.row();

        this.menu=this.table.table(cons(t=>{
            // t.table().size(24,7*24);
            that.menuT=new Table();
            that.infoT=new Table();
            t.table(Stys.button,cons(t=>{
                t.pane(cons(t=>{
                    t.add(that.menuT).width(48*3+24*1);
                })).size(48*3+24,7*24).get().setStyle(Styles.smallPane);
                t.row()
                t.add(that.bottomButtons).width(48*3+24).height(48).left()
                that.bottomButtons.setBackground(Stys.buttonNoBackground)
            })).size(48*3+24,7*24+48);
            t.table(cons(t=>{
              t.table().height(22).row()
              that.info=t.table(Stys.button,cons(t=>{
                t.table(Stys.buttonNoBackground,cons(t=>{
                    t.label(prov(()=>Manager.connected&&that.infoCanClose==false?Manager.connectData.version:that.infoTitle)).growX().left();
                    let b=t.button(Core.atlas.drawable("aimclient-close"),Stys.di,run(()=>{
                        that.infoCanClose=false;
                        that.infoTitle="";
                        that.infoT.clear();
                        that.infoT.add(that.defaultInfoT);
                    })).size(48,18).right().get();
                    b.visibility=boolp(()=>that.infoCanClose);
                    b.resizeImage(16)
                })).size(300,18).row();
                t.table(cons(t=>{
                    t.pane(cons(t=>{
                        t.add(that.infoT)
                    })).size(300,7*24+48*1.6)
                })).size(300,7*24+48*1.6);
              }))
              t.row()
              t.table().height(3*24)
            }))
        })).width(48*3+24+300).height(0).left()
        this.menu.get().visibility=boolp(()=>that.showingMenu&&that.s);
        this.table.row();


        this.table.update(run(()=>{
            let my=0;
            for(let f of that.moveY){
                my+=f();
            }
            my/=(Core.settings.getInt("uiscale",100)/100-1)*1.5+1;
            let cx=that.x<0?0:that.x>Manager.width()*.8?Manager.width()-that.table.getWidth():that.x;
            let cy=that.y+my<0?0:that.y+my>Manager.height()-that.table.getHeight()?Manager.height()-that.table.getHeight():that.y+my;
            that.table.setPosition(cx,cy);
            if(Manager.maximizeWindows.length==0) that.table.toFront()


            if(!Vars.net.client()){
                Manager.connected=false;
            }
        }))
        Core.scene.add(this.table);
        // let window=new (require("Window"))();
        // window.setBody(this.table);
        // window.setTitle("AimClient");
        // window.setSize(48*3+24*1+300,7*24+48);
        // window.show();
        this.moveY.push(()=>-(this.showingMenu*4*24))
        this.showMenu(true)
        this.showMenu(true)
        Marks.init()
    },
    showMenu(canClose){
        if(canClose){
            this.showingMenu=!this.showingMenu;
        }else{
            this.showingMenu=true;
        }
        if(this.showingMenu){
            this.menu.size(48*4+300,7*24+48)
        }else{
            this.menu.size(48*4+300,0)
        }
        this.jumpTo(this.path);
    },
    showingMenu:false,
    path:"main",
    jumpTo(path){
        let menu=this.menus;
        path=path.split(".");
        let str=path.join("|")
        if(path.length>0){
            for(let x of path){
                str+=x+"\n"
                menu=menu.childs[x];
                if(menu==undefined)throw new Error("Menu not found: "+path.join(".")+"\n"+str);
            }
        }
        if(menu.hasChild){
            this.menuT.clear();
            this.path=path.join(".");
            if(path.length>1){
                let t=this.menuT.button(Core.atlas.drawable("aimclient-back"),Stys.di,run(()=>{
                    this.jumpTo(path.slice(0,-1).join("."));
                })).size(48*3+24*1,24).get();
                t.image().color(Color.valueOf("ff0000")).size(12,12);
                t.table(cons(t=>{
                    t.image(Core.atlas.drawable("aimclient-back")).size(16,16)
                })).size(24,24);
                t.label(prov(()=>"@back")).size(48*3,24)
                this.menuT.row();
            }
            for(let x in menu.childs){
                let y=x;
                let child=menu.childs[x];
                if(child.icon){
                    let t=this.menuT.button(child.icon,Stys.di,run(()=>{
                        this.jumpTo(path.concat(y).join("."));
                    })).size(48*3+24*1,24).get();
                    t.image().color(child.hasChild?Color.valueOf("44aaff"):Color.valueOf("ffaa00")).size(12,12);
                    t.table(cons(t=>{
                        t.image(child.icon).size(16,16)
                    })).size(24,24);
                    t.label(prov(()=>child.name)).size(48*3-24,24);
                    t.label(prov(()=>child.hasChild?">":"")).size(24,24).right();
                    t.visibility=boolp(()=>(!child.visibility)||child.visibility());
                }else{
                    let t=this.menuT.button(Stys.empty,Stys.di,run(()=>{
                        this.jumpTo(path.concat(y).join("."));
                    })).size(48*3+24*1,24).get();
                    t.image().color(child.hasChild?Color.valueOf("44aaff"):Color.valueOf("ffaa00")).size(12,12);
                    t.table().size(24,24);
                    t.label(prov(()=>child.name)).size(48*3-24,24);
                    t.label(prov(()=>child.hasChild?">":"")).size(24,24).right();
                    t.visibility=boolp(()=>(!child.visibility)||child.visibility());
                }
                this.menuT.row();
            }
        }else{
            this.exec(menu);
        }
    },
    exec(noChildMenu){
        // print("exec: "+noChildMenu.name);
        if(noChildMenu.info){
            this.infoCanClose=true;
            this.infoTitle=noChildMenu.name;
            this.infoT.clear();
            this.infoT.add(noChildMenu.info);
        }
        if(noChildMenu.run){
            noChildMenu.run();
        }

    },
    table:new Table(),
    bottomButtons:new Table(),

    buttons:null,
    menu:null,
    menuT:null,
    info:null,
    infoTitle:null,
    infoCanClose:false,
    infoT:null,
    defaultInfoT:null,
    votes:null,

    menus:{},

    x:0,
    y:0,


    moveY:[]
}