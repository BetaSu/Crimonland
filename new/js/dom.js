//处理dom以及图片音频的加载

var mode=(function  () {
		
	var gameTrigger=document.getElementsByClassName("m-trigger");
	for (var q=0;q<gameTrigger.length;q++) {
		var usedTrigger=gameTrigger[q];
		usedTrigger.index=q;
		usedTrigger.onmousemove=function  (e) {
			var content=engine.$("f-triggerContent"),
			contentP=content.getElementsByTagName("p")[0];
			content.style.display="block";
			content.style.left=e.clientX+15+"px";
			content.style.top=e.clientY-10+"px";
			contentP.innerText=this.dataset.name+this.dataset.attribute;
		}
		usedTrigger.onmouseleave=function  (e) {
			engine.$("f-triggerContent").style.display="none";
		}
		usedTrigger.onclick=function  () {
			sounds.play("enter",false);
			triggerAttribute[this.index].execute();
		}
	}
	var ImagesMode=engine.ImagesMode;
	var pics=new ImagesMode();
	var SoundsMode=engine.SoundsMode;
	var sounds=new SoundsMode();

	// 添加音频
	sounds.queueSound("sounds/bkg.ogg");
	sounds.queueSound("sounds/reload.ogg");
	sounds.queueSound("sounds/手枪.ogg");
	sounds.queueSound("sounds/突击步枪.ogg");
	sounds.queueSound("sounds/霰弹枪.ogg");
	sounds.queueSound("sounds/狙击步枪.ogg");
	sounds.queueSound("sounds/mAttacked.ogg");
	sounds.queueSound("sounds/attacked.ogg");
	sounds.queueSound("sounds/enter.ogg");
	sounds.queueSound("sounds/repeal.ogg");
	sounds.queueSound("sounds/die.ogg");

	//添加图片
	pics.queueImage("images/bkg1.jpg");
	pics.queueImage("images/talent.jpg");
	pics.queueImage("images/bkg.jpg");
	pics.queueImage("images/sprite.png");

	var resourceLoad=setInterval(function  (e) {
		var percentage=(pics.loadImages()+sounds.loadSounds())/2,
		loading=engine.$("loading");
		loading.innerText="加载中 "+percentage+"%";
		
		if (percentage==100) {
			clearInterval(resourceLoad);
			pics.imageReady=true;
			sounds.soundsReady=true;
			var fail=pics.imagesFailedToLoad+sounds.soundsFailedToLoad;
			loading.innerText=" 加载完毕"+" 失败:"+fail;
		}
		if (pics.imageReady && sounds.soundsReady) {
			var enterTalent=engine.$("enterTalent");
			enterTalent.disabled="";
			enterTalent.style.background="#f42122";
			enterTalent.style.cursor="pointer";
			enterTalent.onclick=function  () {
				var load=engine.$("load"),
				main=engine.$("g-main");
				load.style.display="none";
				main.style.display="block";
				sounds.play("enter",false);
			}
		}	
	},20);

	function pointsChange () {
		var point=engine.$("f-points"),
		enter=engine.$("enter");
		point.innerText=points;
		if (points>0) {
			enter.style.background="#666";
			enter.disabled="disabled";
			enter.style.cursor="";
		} else {
			enter.style.background="#f42122";
			enter.disabled="";
			enter.style.cursor="pointer";
		}
	}

	function siblingLevel (item,updown) {
		var divs=item.parentNode.getElementsByTagName("div"),
		box=[],
		name=item.dataset.name;
		for(var l=0;l<divs.length;l++) {
			if (divs[l].dataset.name==name.substring(0,1)+(Number(name.substring(1,2))+updown)) {
				box.push(divs[l]);
			}
		}
		return box;
	}

	function talentAdd (item) {
		var name=item.dataset.name,
					click=Number(item.dataset.click),
					num=Number(item.dataset.num),
					have=Number(item.dataset.have);
					if (click) {
						if (num>have) {
							have++;
							points--;
							item.dataset.num=num;
							item.dataset.have=have;
							pointsChange();
							item.style.background="url(images/talent.jpg)"+" "+talentBkg[item.index].left1+"px"+" "+talentBkg[item.index].top1+"px";
							item.getElementsByTagName("h1")[0].innerText=have+"/"+num;
							if (num==have) {
								var levelItem=siblingLevel(item,1);
								for (var i=0;i<levelItem.length;i++) {
									levelItem[i].dataset.click=1;	
								}
							}
							return true;
						}
						
					}
	}

	function talentSub (item) {
		var name=item.dataset.name,
					click=Number(item.dataset.click),
					num=Number(item.dataset.num),
					have=Number(item.dataset.have);
					if (click) {
						if (have!==0) {
							have--;
							points++;
							item.dataset.num=num;
							item.dataset.have=have;
							pointsChange();
							item.getElementsByTagName("h1")[0].innerText=have+"/"+num;
							if (have==0) {
							item.style.background="url(images/talent.jpg)"+" "+talentBkg[item.index].left+"px"+" "+talentBkg[item.index].top+"px";
							}
						}
					return true;	
					}
	}

	var talentItems=engine.$("talent").getElementsByClassName("m-item"),
	points=8;		//天赋点数


	pointsChange();
	for (var i=0;i<talentItems.length;i++) {
			var items=talentItems[i].getElementsByTagName("div");
			for (var j=0;j<items.length;j++) {
				var item=items[j];
				item.j=j;
				item.i=i;
				item.index=Number(String(item.i)+String(item.j));
				item.style.background="url(images/talent.jpg)"+" "+talentBkg[item.index].left+"px"+" "+talentBkg[item.index].top+"px";
				item.getElementsByTagName("h1")[0].innerText=item.dataset.have+"/"+item.dataset.num;
				item.onclick=function  (e) {
					sounds.play("enter",false);
					if (points>0) {
						var add=talentAdd(this);
						if (add) {
							var previousLevel=siblingLevel(this,-1);
							if(previousLevel.length>0) {
								for(var i=0;i<previousLevel.length;i++) {
									previousLevel[i].dataset.click=0;
								}
							}
							var thisLevel=siblingLevel(this,0);
							if(thisLevel.length>1) {
								for (var j=0;j<thisLevel.length;j++) {
									talentSub(thisLevel[j]);
								}
								talentAdd(this);
							}
						}
					}	
				}

				item.oncontextmenu=function  (e) {
					sounds.play("repeal",false);
					var sub=talentSub(this);
					if (sub) {
						var previousLevel=siblingLevel(this,-1),
						nextLevel=siblingLevel(this,1);
						if(previousLevel.length>0) {
							for(var i=0;i<previousLevel.length;i++) {
								previousLevel[i].dataset.click=1;
							}
						}
						if(nextLevel.length>0) {
							for(var j=0;j<nextLevel.length;j++) {
								nextLevel[j].dataset.click=0;
							}
						}
					}
					
				}
				item.onmousemove=function  (e) {
					var contentBox=engine.$("talentContent"),
					title=contentBox.getElementsByTagName("h2")[0],
					content=contentBox.getElementsByTagName("p")[0];
					contentBox.style.display="block";
					contentBox.style.left=e.clientX+"px";
					contentBox.style.top=e.clientY+"px";
					title.innerText=talentBkg[this.index].title;
					content.innerText=talentBkg[this.index].content;
				}	
				item.onmouseleave=function  (e) {
					var contentBox=engine.$("talentContent");
					contentBox.style.display="none";
				}	
			}
	}
	var enter=engine.$("enter");
	enter.onclick=function  () {
		engine.$("talentContent").style.display="none";
		sounds.play("enter",false);
		attInitialize();
		var game=engine.$("brower"),
		box=engine.$("box"),
		talent=[];
		box.style.display="none";
		for (var i=0;i<talentItems.length;i++) {
			var items=talentItems[i].getElementsByTagName("div");
			for (var j=0;j<items.length;j++) {
				var item=items[j],
				have=item.dataset.have;
				if (have!=0 && item.index!=4 && item.index!=14 && item.index!=24) talent.push(item);
				if (have!=0 &&(item.index==4 ||item.index==14 ||item.index==24)) weapon=talentBkg[item.index].attribute(Number(have));
			}
		}
		//天赋生效	
		for (var k=0;k<talent.length;k++) {
			if (talentBkg[talent[k].index].attribute) {
				talentBkg[talent[k].index].attribute(Number(talent[k].dataset.have));
			}
			
		}	
		game.style.display="block";
		engine.$("g-paused").style.display="none";
		start();	
	}

	engine.$("f-toTalent").onclick=function  () {
		sounds.play("enter",false);
		engine.$("g-end").style.display="none";
		engine.$("talentContent").style.display="block";
		engine.$("brower").style.display="none";
		engine.$("g-main").style.display="block";
		engine.$("box").style.display="block";	
	}
	return {pics:pics,sounds:sounds}
})()

