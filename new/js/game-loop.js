//游戏循环部分，调用engine属性和方法，调用data属性

function start () {
	var	SpriteSheetPainter=engine.SpriteSheetPainter,
		Timer=engine.Timer,
		Vector=engine.Vector,
		Shape=engine.Shape,
		Projection=engine.Projection,
		Pointer=engine.Pointer,
		Polygon=engine.Polygon,
		Circle=engine.Circle,
		Sprite=engine.Sprite,
		drawBackground=engine.drawBackground,
		getTimeNow=engine.getTimeNow,
		$=engine.$,
		windowToCanvas=engine.windowToCanvas,
		drawShape=engine.drawShape,
		getPolygonPointClosetToCircle=engine.getPolygonPointClosetToCircle,
		polygonCollidesWithCircle=engine.polygonCollidesWithCircle,
		polygonCollidesWithPolygon=engine.polygonCollidesWithPolygon,
		circleCollidesWithCircle=engine.circleCollidesWithCircle,
		MinimumTranslationVector=engine.MinimumTranslationVector,
		separate=engine.separate,
		shapeMove=engine.shapeMove,
		updatePlayerPosition=engine.updatePlayerPosition,
		caculateAngle=engine.caculateAngle,
		randomVector=engine.randomVector,
		Game=engine.Game,
		pics=mode.pics,
		sounds=mode.sounds;


	var game=new Game("z","canvas"),
	zombieNum=0,
	zombieIndex=1,
	firstShoot=true,
	score=0,
	caculated=false,			//是否已经计算分数
	gun,						//使用的枪械
	bodys=[],					//尸体
	lastBodyF5,
	shootInterval,				//射击间隔,用于连射
	shootIndex=1,					//连射计数器
	lastShootTime,				//射击间隔，用于点射
	f5Interval=new Timer(game,1000),		//刷新间隔
	f5Timer=new Timer(game),
	level=1,
	dodge=pA.dodge,						//闪避
	freezeTrigger=pA.freezeTrigger,		//眩晕开关
	fightBack=pA.fightBack,				//反击 
	xuanmaiTrigger=pA.xuanmaiTrigger,		//炫迈一下开关
	levelTrigger=false,          //关卡完成
	spriteSheets={},            //储存精灵表
	context=game.context,
	offCanvas=document.createElement("canvas"),		//离屏canvas，储存脚底背景
	offContext=offCanvas.getContext("2d"),
	speedX,
	speedY,
	recoverAtt=pA.recoverAtt,
	standLuAtt=pA.standLuAtt,	
	doctorAtt=pA.doctorAtt;
	f5Timer.start();
	f5Interval.start();

	//储存所有怪物属性  @
	var monsterType=[
	{type:0,ATK:4,speed:30,life:40,antiKick:0,cell:zombieCell,dieCell:zombieDieCell,interval:50,dieInterval:15,x:-15,y:-15,width:55,height:32,radius:15,score:10},
	{type:1,ATK:2,speed:55,life:30,antiKick:0,cell:lizardCell,dieCell:lizardDieCell,interval:50,dieInterval:15,x:-15,y:-15,width:55,height:32,radius:15,score:7},
	{type:2,ATK:8,speed:20,life:400,antiKick:10,cell:spiderCell,dieCell:spiderDieCell,interval:50,dieInterval:15,x:-10,y:-25,width:80,height:60,radius:40,score:30},
	{type:3,ATK:40,speed:20,life:5000,antiKick:45,cell:bossCell,dieCell:bossDieCell,interval:50,dieInterval:15,x:-5,y:-35,width:100,height:80,radius:70,score:300},
	{type:4,ATK:8,speed:50,life:500,antiKick:20,cell:zombieCell,dieCell:zombieDieCell,interval:50,dieInterval:15,x:-15,y:-10,width:60,height:40,radius:50,score:50},
	{type:5,ATK:5,speed:75,life:40,antiKick:0,cell:lizardCell,dieCell:lizardDieCell,interval:50,dieInterval:15,x:-15,y:-15,width:30,height:25,radius:15,score:12},
	{type:6,ATK:12,speed:40,life:400,antiKick:10,cell:spiderCell,dieCell:spiderDieCell,interval:50,dieInterval:15,x:-10,y:-25,width:30,height:20,radius:15,score:45},
	{type:7,ATK:40,speed:50,life:5000,antiKick:45,cell:bossCell,dieCell:bossDieCell,interval:50,dieInterval:15,x:-5,y:-35,width:100,height:80,radius:70,score:700}];       

	// 精灵对象painter及behaviors
	var player,
	playerPainter={paint:function  (context) {}},
	playerBodyCell=[{left:80,top:70,width:220,height:220}];
	player=new Sprite("player",game.context,playerPainter);
	player.left=game.context.canvas.width/2;
	player.top=game.context.canvas.height/2;
	player.velocityX=pA.runSpeed;
	player.velocityY=pA.runSpeed;
	player.life=pA.life;
	player.totalLife=player.life;
	speedX=Math.abs(player.velocityX);
	speedY=Math.abs(player.velocityY);
	player.painter=new SpriteSheetPainter("player",player,playerBodyCell,pics.getImage("images/sprite.png"),0,-player.radius,-player.radius,player.width,player.height);
	game.player=player;

	var	runPainter=new SpriteSheetPainter("run",player,runCell,pics.getImage("images/sprite.png"),10,-player.radius-0.5,-player.radius,25,25),	
	gunfirePainter=new SpriteSheetPainter("gunfire",player,gunfireCell,pics.getImage("images/sprite.png"),5,11,-player.radius+5.5,20,20);



	//射击部分················
	var Gun=function  (name,speed,rate,offset,ammo,reloadTime,ATK,pierce,shrapnel) {
		this.name=name;
		this.speed=speed;
		this.rate=rate;
		this.offset=offset;
		this.ammo=ammo;
		this.ammoIndex=0;
		this.reloadTime=reloadTime;
		this.lastTime=undefined;
		this.reloading=false;
		this.reloadProcess=undefined;
		this.ATK=ATK;
		this.kick=0;
		this.shrapnel=shrapnel;
		this.pierce=pierce;
		this.fillStyle="#4eb0fc";
	}

	Gun.prototype.shoot=function  (bullets) {
		if (this.ammoIndex<this.ammo) {
			this.reloading=false;
			this.ammoIndex++;
			if (this.kick<this.offset*1000) this.kick+=this.offset*400;
			else this.kick=this.offset*1000;
			sounds.play(this.name,false);
			if (this.shrapnel>0) {
				for (var i=0;i<this.shrapnel;i++) {
					var bullet=new Bullet(this.speed,this.rate,this.offset,this.ATK,this.pierce);
					bullets.push(bullet);
				}
			} else {
				var bullet=new Bullet(this.speed,this.rate,this.offset*this.kick/(this.offset*1000),this.ATK,this.pierce);
				bullets.push(bullet);
			}
			if (this.ammoIndex==this.ammo) {
				if (this.reloading) return;
				this.reload();
			}
			return true;
		}	
	}

	Gun.prototype.reload=function  () {
		this.ammoIndex=this.ammo;
		this.reloading=true;
		this.fillStyle="#f00";
		if (this.name!=="散弹枪") sounds.play("reload",false);
		if (this.reloadProcess==undefined) {
			this.reloadProcess=new Timer(game,this.reloadTime);
			this.reloadProcess.start();
		}	
	}


	var Bullet=function  (speed,rate,offset,ATK,pierce) {
		this.rate=rate;
		this.offset=offset;
		this.speed=speed;
		this.ATK=ATK;
		this.pierce=pierce;
		this.exist=true;
		this.initialize=false;
	}

	Bullet.prototype={
		behind:undefined,
		front:undefined,
		angle:undefined,
		randomAngle:function  () {
			var center=angle,
			max=angle+this.offset,
			min=angle-this.offset,
			range=max-min;
			return min+Math.random()*range;	
		},
		doInitialize:function  () {
			var angle=this.randomAngle();
			this.behind={x:player.left,y:player.top};
			this.front={x:Math.cos(angle)*this.speed+player.left,y:Math.sin(angle)*this.speed+player.top};
			this.initialize=true;
			this.angle=angle;
		},
		updateBulletPosition: function  (context) {
			var lastX=this.front.x,
				lastY=this.front.y;
			this.behind=this.front;
			this.front={x:lastX+this.speed*Math.cos(this.angle),y:lastY+Math.sin(this.angle)*this.speed}
			this.drawBullet(context);
		},
		drawBullet: function  (context) {
			context.save();
			context.beginPath();
			context.lineWidth=0.6;
			context.strokeStyle="#fff";
			context.moveTo(this.behind.x,this.behind.y);
			context.lineTo(this.front.x,this.front.y);
			context.stroke();
			context.restore();
		},
		collidesWith:function  () {
			if (this.front.x>canvas.width || this.front.x<0 || this.front.y>canvas.height || this.front.y<0) {
				this.exist=false;
			}
		},
		execute:function  (context) {
			if (!this.initialize) {this.doInitialize()}
			if (this.exist) {
				this.updateBulletPosition(context);
				this.collidesWith();
			} else {
				for (var i=0;i<bullets.length;i++) {
					if (bullets[i].index==this.index) bullets.splice(i,1);
				}
			}
		}
	};


		//使用的枪械
		gun=new Gun(weapon.name,weapon.speed,weapon.rate,weapon.offset,weapon.ammo,weapon.reloadTime,weapon.ATK,weapon.pierce,weapon.shrapnel);  
		// zombie behaviors``````

		ZombieBehaviors=function  () {
			this.interval=undefined;
			this.angleTriggle=false;
			this.sprite=undefined;
			this.angle=undefined;
			this.player=player;
		}
		
		ZombieBehaviors.prototype.hangout=function  () {
				var player=new Vector(this.player.left,this.player.top),
				target=player.subtract({x:this.sprite.left,y:this.sprite.top});
				this.angle=caculateAngle(target,0,0);
				this.sprite.angle=this.angle;
			};
		ZombieBehaviors.prototype.advance=function  () {
			if (Math.sqrt(Math.pow(this.sprite.left-this.player.left,2)+Math.pow(this.sprite.top-this.player.top,2))<this.sprite.radius+this.player.radius-4) {this.sprite.freezing(this.sprite);
			} 
		};
		ZombieBehaviors.prototype.stepBack=function  () {
			var sprite=this.sprite,
			type=sprite.type;
			if (sprite.shooted) {
				var bullet=sprite.whichBullet,
				atk=bullet.ATK.min+Math.random()*(bullet.ATK.max-bullet.ATK.min);
				bulletAngle=bullet.angle;
				if (atk-sprite.antiKick>0) {
					sprite.left+=Math.cos(bulletAngle)*(atk-sprite.antiKick);
					sprite.top+=Math.sin(bulletAngle)*(atk-sprite.antiKick);
				} 
				if (freezeTrigger) sprite.freezing(sprite);
				sprite.life-=atk;
				sprite.shooted=false;
				sprite.whichBullet=null;
			}
			if (sprite.life<=0) {
				sprite.painter=new SpriteSheetPainter("zombie",sprite,monsterType[type].dieCell,pics.getImage("images/sprite.png"),monsterType[type].dieInterval,monsterType[type].x,monsterType[type].y,monsterType[type].width,monsterType[type].height);
				spriteSheets[sprite.name+sprite.index]=sprite.painter;
				deadBody(sprite);
				removeZombie(sprite);
			}
		};	
		ZombieBehaviors.prototype.hunt=function  () {
			var sprite=this.sprite;
			//改善
			if (sprite.exist) spriteSheets[sprite.name+sprite.index]=sprite.painter;
			if (!sprite.freeze) {	
				var targetX=player.left,
				targetY=player.top;
				if (targetX-sprite.left>0) {
					sprite.velocityX=Math.abs(sprite.velocityX);
				}	else sprite.velocityX=-Math.abs(sprite.velocityX);
				if (targetY-sprite.top>0) {
					sprite.velocityY=Math.abs(sprite.velocityY);
				}	else sprite.velocityY=-Math.abs(sprite.velocityY);
				sprite.left+=Math.abs(game.pixelsPerFrame(sprite.velocityX))*Math.cos(this.angle);
				sprite.top+=Math.abs(game.pixelsPerFrame(sprite.velocityY))*Math.sin(this.angle);
			}
		};
		ZombieBehaviors.prototype.freeze=function  () {
			var sprite=this.sprite;
			if (sprite.freezeTimer) {
				if (sprite.freezeTimer.isComplete()) {
					sprite.freeze=false;
					sprite.freezeTimer=undefined;
				}
			}		
		}
		ZombieBehaviors.prototype.execute=function  (sprite) {
			var random=Math.random();
			this.player=player;
			this.sprite=sprite;
			this.advance();
			this.stepBack();
			this.hangout();
			this.hunt();
			this.freeze();
		}
		var zombiePainter={
			paint:function  (context) {}};

		//创建僵尸		
		function createZombie (num,type) {
			if (num<1) return;
			//出生地点
			function birthPoint () {
					var x,y,index0,index1;
					index0=Math.random();
					index1=Math.random();
					if (index0<0.5 && index1<0.5) x=-70;
					if (index0<0.5 && index1>0.5) x=context.canvas.width+70;
					if (index0>0.5) x=Math.random()*context.canvas.width;
					if (x<0 ||x>context.canvas.width) y=Math.random()*(context.canvas.height);
					else {
						var index=Math.random();
						if (index<0.5) y=-70;
						else y=context.canvas.height+70;	
					}
				return {x:x,y:y}
				}
			for (var i=0;i<num;i++) {
				var point=birthPoint(),
				randomVelocity=monsterType[type].speed,
				velocity=randomVelocity+Math.random()*randomVelocity*2,
				zombie=new Sprite("zombie",game.context,zombiePainter,[new ZombieBehaviors()]);
				zombie.left=point.x;
				zombie.top=point.y;
				zombie.painter=new SpriteSheetPainter("zombie",zombie,monsterType[type].cell,pics.getImage("images/sprite.png"),monsterType[type].interval,monsterType[type].x,monsterType[type].y,monsterType[type].width,monsterType[type].height);
				zombie.velocityX=velocity;
				zombie.velocityY=velocity;
				zombie.radius=monsterType[type].radius;
				zombie.life=monsterType[type].life;
				zombie.birthday=new Timer(game,1000);
				zombie.score=monsterType[type].score;
				zombie.shooted=false;
				zombie.attacking=undefined;
				zombie.whichBullet=undefined;
				zombie.antiKick=monsterType[type].antiKick;
				zombie.freezeTimer=undefined;
				zombie.type=type;
				zombieNum++;
				zombie.index=zombieIndex;	
				zombieIndex++;
				zombie.birthday.start();
				zombie.attack=function  (zombie) {
					if (zombie.birthday.isComplete()) {
						recoverAtt.speedTrigger=false;
						if (zombie.attacking==undefined) {
							zombie.attacking=new Timer(game,500);
							zombie.attacking.start();
						}	
						if (zombie.attacking.isComplete()) {
							if(randomNum(dodge)) {
								zombie.life-=fightBack;
								player.life-=monsterType[type].ATK; 
								sounds.play("attacked",false);
								if (doctorAtt.trigger) {
									if (randomNum(doctorAtt.percentage)) player.life=-1;
								}
							}		
							player.velocityX=speedX/1.1;
							player.velocityY=speedY/1.1;
							zombie.attacking=undefined;
						}								
					}	
				};
				zombie.freezing=function  (zombie) {
					zombie.freeze=true;
					if (zombie.freezeTimer==undefined) {
						zombie.freezeTimer=new Timer(game,600);
						zombie.freezeTimer.start();
					}
				}
				addSprite(zombie);
			}	
		}

		// 键盘监听
		//上
		game.addKeyListener({key:87,listener:function  () {
			if (player.exist) {
				player.velocityY=-Math.abs(player.velocityY);
				if (!runPainter.isRunning) spriteSheets[runPainter.name]=runPainter; 	
				player.top+=game.pixelsPerFrame(player.velocityY);
			}
			
		}})
		//下
		game.addKeyListener({key:83,listener:function  () {
			if (player.exist) {
				player.velocityY=Math.abs(player.velocityY);
			if (!runPainter.isRunning) spriteSheets[runPainter.name]=runPainter; 
			player.top+=game.pixelsPerFrame(player.velocityY);
			}
			
		}})
		// 左
		game.addKeyListener({key:65,listener:function  () {
			if (player.exist) {
					player.velocityX=-Math.abs(player.velocityX);
			if (!runPainter.isRunning) spriteSheets[runPainter.name]=runPainter; 
			player.left+=game.pixelsPerFrame(player.velocityX);
			}
		
		}})
		// 右
		game.addKeyListener({key:68,listener:function  () {
			if (player.exist) {
				player.velocityX=Math.abs(player.velocityX);
			if (!runPainter.isRunning) spriteSheets[runPainter.name]=runPainter; 
			player.left+=game.pixelsPerFrame(player.velocityX);
			}
			
		}})

		// 障碍物
		var shapes=[],
		polygonPoints=[
			[new Pointer(427,234),new Pointer(495,201),new Pointer(561,319),new Pointer(493,351)],
		],
		polygonStrokeStyle="rgba(0,0,0,0)";
		for (var i=0;i<polygonPoints.length;i++) {
			var polygon=new Polygon(),
			points=polygonPoints[i];
			polygon.strokeStyle=polygonStrokeStyle;
			points.forEach(function  (point) {
				polygon.addPoint(point.x,point.y);
			});
			shapes.push(polygon);
		};

		//添加精灵对象
		function addSprite (sprite) {
			game.addSprite(sprite);
			shapes.push(sprite);
		}

		//移除僵尸对象
		function removeZombie (sprite) {
			score+=sprite.score;
			game.removeSprite(sprite);
			for (var i=0;i<shapes.length;i++) {
				if (shapes[i].index==sprite.index) shapes.splice(i,1);
			}
			sprite.exist=false;
			zombieNum--;
		}
	// @
		function f5Zombie () {
			var f5=f5Timer.getElapsedTime();
			function f5Z (interval) {
				if (f5Interval==undefined) {
					f5Interval=new Timer(game,interval);
					f5Interval.start();
					level++;
				}
			}
			if (level<10) {
					createZombie(1,0);
					createZombie(1,1);
					f5Z(3000);
			}
			if (level==10) {
				createZombie(1,4);
				createZombie(5,1);
				f5Z(10000);
			}
			if (level>10 && level<20) {
					createZombie(2,0);
					createZombie(1,5);
					f5Z(6000);
			}
			if (level==20) {
				createZombie(1,3);
				f5Z(12000);
			}
			if (level>20 && level<40 ) {
					createZombie(1,2);
					createZombie(2,1);
					f5Z(6000);
			}
			if (f5>150000 && level==40) {
					createZombie(1,7);
					f5Z(22000);
			}
			if (level>40 && level<60 ) {
					createZombie(2,4);
					createZombie(1,0);
					f5Z(6000);
			}
			if ( level==60 ) {
					createZombie(20,5);
					f5Z(24000);
			}
			if (level>60 ) {
					createZombie(1,6);
					createZombie(1,7);
					f5Z(22000);
			}
		}
		addSprite(player);

		// 碰撞检测
		function detectCollisions () {
			var shape,player,zombie,touched=0;
			for (var i=0;i<shapes.length;i++) {
				if (shapes[i].name=="player" ) player=shapes[i];
				if (shapes[i]!==undefined &&shapes[i].name=="zombie") zombie=shapes[i];
				for (var j=0;j<shapes.length;j++) {
							shape=shapes[j];
							if (shape.name!=="player" &&shape.name!=="zombie" &&zombie!==undefined) {
								var mtv1=player.collidesWith(shape);
								separate(player,mtv1);
								var mtv2=zombie.collidesWith(shape);
								separate(zombie,mtv2);
							}
							if (shape!=player &&shape.name=="zombie" &&zombie!==undefined) {
								var mtv3=player.collidesWith(shape);
								shape.collides=mtv3;
								if (mtv3 &&game.gameTime>2000) {
									shape.attack(shape);
									touched++;
								}	
							}	
				}
				if (touched==0) recoverAtt.speedTrigger=true;
			}	
			if (player.left>canvas.width) player.left=canvas.width-2;
			if (player.left<0) player.left=2;
			if (player.top>canvas.height) player.top=canvas.height-2;
			if (player.top<0) player.top=2;
		}

	// 子弹碰撞检测
		function bulletCollisions () {
			var shape,bullet;
			for (var i=0;i<shapes.length;i++) {
				if (shapes[i].name!=="player") shape=shapes[i];
				for (var j=0;j<bullets.length;j++) {
					if (bullets[j].exist) {
						bullet=bullets[j];
						if (bullet.front==undefined) {return;}
						var headCollision=shape.isPointInPath(context,bullet.front.x,bullet.front.y),
						footCollision=shape.isPointInPath(context,bullet.behind.x,bullet.behind.y);
						if (headCollision || footCollision) {
							//击中僵尸
							if (shape.name=="zombie") {
								if (firstShoot) {
									firstShoot=false;
									sounds.play("bkg",true);
								}
								shape.whichBullet=bullet;
								shape.shooted=true;
								sounds.play("mAttacked",false);
							}
							bullet.pierce-=1;
							if (bullet.pierce==0) bullet.exist=false;	
						}	
					}
						
				}
			}	
		}

		//重绘鼠标样式
		function mouseStyle () {
			$("canvas").style.cursor="none";
			context.save();
			context.font="20px 宋体";
			context.fillStyle=gun.fillStyle;
			context.fillText(gun.ammo-gun.ammoIndex,game.mouse.x-5,game.mouse.y-20);		
			context.beginPath();
			context.arc(game.mouse.x,game.mouse.y,4,0,Math.PI*2,true);
			context.arc(game.mouse.x,game.mouse.y,8,0,Math.PI*2,false);
			context.fill();
			context.restore();
			if (gun.kick>0) {
				context.save();
				context.fillStyle="#14c9f6";
				context.beginPath();
				context.arc(game.mouse.x,game.mouse.y,gun.kick,0,Math.PI*2,true);
				context.arc(game.mouse.x,game.mouse.y,gun.kick+2,0,Math.PI*2,false);
				context.fill();
				context.restore();
			}	
		}

		//生命显示
		function lifeStyle () {
			var percentage=player.life/player.totalLife,
				lifeColor;
			if (percentage>=0.6 || percentage==1) lifeColor="#4eb0fc";
			if (percentage>=0.2 && percentage<0.6) lifeColor="#fad610";
			if (percentage<0.2) lifeColor="#f00";
			if (percentage>0) {
				context.save();
				context.beginPath();
				var capture=context.getImageData(player.left-25,player.top-25,50,50);
				context.fillStyle=lifeColor;
				context.arc(player.left,player.top,25,0,Math.PI*2*percentage,false);
				context.fill();
				context.restore();
				offContext.putImageData(capture,0,0);
				context.save();
				context.beginPath();
				context.arc(player.left,player.top,20,0,Math.PI*2,false);
				context.clip();
				context.drawImage(offCanvas,0,0,50,50,player.left-25,player.top-25,50,50);	
				context.restore();
			}
		}

		//速度、生命恢复
		function recover () {
			if (Math.abs(player.velocityX)!=speedX &&recoverAtt.speedTrigger) {
				setTimeout(function  () {
					player.velocityX=speedX;
					player.velocityY=speedY;
				},recoverAtt.speedRecover)
			}
			if (player.life<pA.life &&recoverAtt.lifeTrigger) {
				var now=getTimeNow();
				if (now-recoverAtt.lastLifeRecover>recoverAtt.lifeRecover) {
					player.life+=1;
					recoverAtt.lastLifeRecover=now;
				}
			}
		}

		//阴影
		function shadow () {
			var shadowCell=[{left:0,top:1280,width:44,height:39}];
			for (var i=0;i<game.sprites.length;i++) {
				if (game.sprites[i]!=undefined) var sprite=game.sprites[i];
				var shadowPainter=new SpriteSheetPainter("shadow",sprite,shadowCell,pics.getImage("images/sprite.png"),0,sprite.painter.x,sprite.painter.y,sprite.painter.width*1.4,sprite.painter.height*1.2);
				spriteSheets["shadow"+sprite.index]=shadowPainter;
			}
		}

		//尸体显示
		function deadBody (sprite) {
			var bodyPainter=new SpriteSheetPainter("deadBody",sprite,deadBodyCell[sprite.type],pics.getImage("images/sprite.png"),0,sprite.painter.x,sprite.painter.y,sprite.painter.width,sprite.painter.height);
				setTimeout(function  () {
					spriteSheets["dead"+sprite.index]=bodyPainter;
					bodys.push("dead"+sprite.index);
				},300)
		}

		//尸体刷新
		function f5Body () {
			var now=getTimeNow();
			if (lastBodyF5) {
				if (bodyInterval!=0) {
					if (now-lastBodyF5>bodyInterval) {
						for (var i=0;i<bodys.length;i++) {
							delete spriteSheets[bodys[i]];
						}
					lastBodyF5=now;	
					}
				}
			} else lastBodyF5=now;		
		}

		//站撸
		function standLu () {
			var x=player.left,
			y=player.top,
			now=getTimeNow();
			if (x==standLuAtt.x && y==standLuAtt.y) {
				if (standLuAtt.lastTime && now-standLuAtt.lastTime>2500) {
					var usedGun=gun;
					gun=new Gun("站撸",10,100,Math.PI*2,2,600,{min:30,max:30},2,60);
					gun.shoot(bullets);
					sounds.play('狙击步枪',false);
					gun=usedGun;
					standLuAtt.lastTime=now;
				}
			} else {
				standLuAtt.x=x;
				standLuAtt.y=y;
				standLuAtt.lastTime=now;
			}
		}

		// 血性射击
		function blood () {
			var usedGun=gun,
				percentage=player.life/player.totalLife,
				xuanmaiGun=new Gun("xuanmai",weapon.speed,weapon.rate,weapon.offset,weapon.ammo,weapon.reloadTime,weapon.ATK,weapon.pierce,weapon.shrapnel);  
			if (player.life>5) {
				gun=xuanmaiGun;
				gun.shoot(bullets);
				sounds.play('自动步枪',false);
				player.life-=2.7*percentage;
				gun=usedGun;
			}
		}

		//随机产生器
		function randomNum (percentage) {
			if (Math.random()<percentage) return true;
			else return false;
		}

		// 精灵表回调函数
		function spriteSheetCallback () {
			var now=getTimeNow();
			for (i in spriteSheets) {
				if (now-spriteSheets[i].lastTime>spriteSheets[i].interval) {
					spriteSheets[i].paint(context);
					spriteSheets[i].advance(spriteSheets);	
					if (spriteSheets[i]) spriteSheets[i].lastTime=now;	
				}	
			}
		}

		//射击回调函数
		function shoot () {
			if (gun.kick>0) gun.kick-=gun.offset*40;
			else gun.kick=0;
			for (var i=0;i<bullets.length;i++) {
					bullets[i].execute(context);	
			} 
			if (gun.reloadProcess && gun.reloadProcess.isComplete()) {
				gun.fillStyle="#4eb0fc";
				gun.ammoIndex=0;
				gun.reloadProcess=undefined;
			}
			if (shootInterval!==undefined && Math.abs(shootInterval.getElapsedTime()-gun.rate*shootIndex)<70) {
				var shoot=gun.shoot(bullets);
				shootIndex++;
				if(xuanmaiTrigger && gun.reloading) {
					blood();
				}
				if (shoot) spriteSheets[gunfirePainter.name]=gunfirePainter; 
			}	
		}

		// 计时器回收 
		function deleTimer () {
			for (var i=0;i<game.timers.length;i++) {
				var timer=game.timers[i];
				if (!timer.effect) {
					game.timers.splice(i,1);
				}
			}
		}

		//性能监测
		function fpsDetect () {
			var fps=game.fps;
			if (fps<50 &&game.gameTime>2000) {
				bodyInterval=2000;
				triggerAttribute[3].execute();
				shadowTrigger=false;
				triggerAttribute[2].execute();
			}
		}

		// 分数计算
		function caculateScore () {
			if (!caculated) {
				score+=game.gameTime/200;
				score=score*(1+level/70);
				if (score-Math.pow(zombieNum,2)>0) score=score-Math.pow(zombieNum,2);
				else score=0;
				caculated=true;
				score=Math.ceil(score);
				var final= {weapon:gun.name,score:score,time:Math.ceil(game.gameTime/1000)};
				var box=$('m-showScore').getElementsByTagName('span');
				box[0].textContent=final.time+" 秒";
				box[1].textContent=final.weapon;
				box[2].textContent=final.score;
			}
		}

		//player死亡
		function playerDead () {
			sounds.play("die",false);
			player.exist=false;
			player.painter=new SpriteSheetPainter("dead",player,playerDeadCell,pics.getImage("images/sprite.png"),15,-player.radius,-player.radius,player.width,player.height);
				spriteSheets["player"+player.name]=player.painter;
			setTimeout(function  () {
				$("g-end").style.display="block";
				$("g-main").style.display="none";
				game.gameOver=true;	
			},1000)	
		}

		canvas.onmousemove=function  (e) {
			game.mousemove(e);
			angle=caculateAngle(game.mouse,player.left,player.top);
			player.angle=angle;
		}

		//连射，点射
		canvas.onmousedown=function  (e) {	
			if (player.exist) {
				if (!lastShootTime) {
				var shoot=gun.shoot(bullets);
				if(xuanmaiTrigger && gun.reloading) {
					blood()
				}
				if (shoot) spriteSheets[gunfirePainter.name]=gunfirePainter; 
				lastShootTime=game.gameTime;
			}
			if (shootInterval==undefined) {
				shootInterval=new Timer(game);
				shootInterval.start();
			}				
			}	
		}
		canvas.onmouseup=function  (e) {
			// if (player.exist) clearInterval(shootInterval);
			if (player.exist) {
				shootInterval=undefined;
				shootIndex=1;
			}	
		}
		canvas.onclick=function  (e) {
			if (player.exist) {
					if (game.gameTime-lastShootTime>gun.rate) {
					var shoot=gun.shoot(bullets);
					if(xuanmaiTrigger && gun.reloading) {
						blood()
					}
					if (shoot) spriteSheets[gunfirePainter.name]=gunfirePainter; 
					lastShootTime=game.gameTime;
				}		
			}	
		}

		canvas.oncontextmenu=function  (e) {
			gun.reload();
		}

			// 暂停

			canvas.onmouseleave=function  () {
				if (game.gameTime>400 && !game.paused) {
					$("g-paused").style.display="block";
					game.togglePaused();
					sounds.pause('bkg');
				}	
			}
			$("g-paused").onmouseenter=function  () {
				if (game.gameTime>400 && game.paused) {
					$("g-paused").style.display="none";
					game.togglePaused();
					sounds.pause('bkg');
				}	
			}

		sounds.play("reload",false);
		//回调函数
		game.paintUnderSprites=function  () {
			if (player.exist) {
				drawShape(game,shapes);
				if (f5Interval!==undefined && f5Interval.isComplete()) {
					f5Interval=undefined;
					f5Zombie();	
				}	
				if (shadowTrigger) shadow();
				if (fpsTrigger) fpsDetect();
				f5Body();
			}
		};
		game.paintOverSprites=function  () {
			if (standLuAtt.trigger) standLu();
		};
		game.startAnimate=function  () {
				drawBackground(pics,game,"images/bkg.jpg");
				detectCollisions();
				spriteSheetCallback();
				updatePlayerPosition(shapes);
			if (player.exist) {
				mouseStyle();
				lifeStyle();
				game.keyListener();
				shoot();
				bulletCollisions();
				recover();
			}	
		};
		game.endAnimate=function  () {
			deleTimer();
			if (player.life<=0) {
				playerDead();
				caculateScore();
			}
		};

		game.start();
	}

 