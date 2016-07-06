//本引擎分为两部分--功能部分与构造器部分
//输出储存在全局变量engine中

var engine=(function  () {
	
// 引擎功能部分
	var drawBackground=function  (imagesMode,game,imageUrl) {
	if (imagesMode.imageReady) game.context.drawImage(imagesMode.getImage(imageUrl),0,0);
	},

	getTimeNow=function  () {
		return +new Date();
	},

	$=function  (id) {
			return document.getElementById(id);
	},

	windowToCanvas=function  (x,y) {
		var bbox=canvas.getBoundingClientRect();
		return {x:x-bbox.left*canvas.width/bbox.width,y:y-bbox.top*canvas.height/bbox.height}
	},

	drawShape=function  (game,shapes) {
		shapes.forEach(function  (shape) {
			shape.stroke(game.context);
		});
	},

	getPolygonPointClosetToCircle=function  (polygon,circle) {
		var min=10000,length,testPoint,closetPoint;
		for (var i=0;i<polygon.points.length;i++) {
			testPoint=polygon.points[i];
			length=Math.sqrt(Math.pow(testPoint.x-circle.x,2)+Math.pow(testPoint.y-circle.y,2));
			if (length<min) {
				min=length;
				closetPoint=testPoint;
			}
		}
		return closetPoint;
	},

	polygonCollidesWithCircle=function  (polygon,circle) {
		var v1,v2,axes=polygon.getAxes(),
		closetPoint=getPolygonPointClosetToCircle(polygon,circle);
		v1=new Vector(circle.x,circle.y);
		v2=new Vector(closetPoint.x,closetPoint.y);
		axes.push(v1.subtract(v2).normalize());
		return polygon.minimumTranslationVector(axes,circle);
	},

	polygonCollidesWithPolygon=function  (p1,p2) {
		var mtv1=p1.minimumTranslationVector(p1.getAxes(),p2);
		var mtv2=p1.minimumTranslationVector(p2.getAxes(),p2);
		if (mtv1.overlap===0 && mtv2.overlap===0) return {axis:undefined,overlap:0}
		else return mtv1.overlap<mtv2.overlap?mtv1:mtv2;
	},

	circleCollidesWithCircle=function  (c1,c2) {
		var distance=Math.sqrt(Math.pow(c2.x-c1.x,2)+Math.pow(c2.y-c1.y,2)),
		overlap=Math.abs(c1.radius+c2.radius)-distance;
		return overlap<0?undefined:new MinimumTranslationVector(undefined,overlap);
	},

	//碰撞后分离
	separate=function  (shape,mtv) {
		var vX=shape.velocityX,
		vY=shape.velocityY;
		if (mtv!==undefined) {
			var dx,dy,point,velocityMagnitude;
		if (mtv.axis===undefined) {
			point=new Pointer();
			velocityMagnitude=Math.sqrt(Math.pow(vX,2)+Math.pow(vY,2));

			point.x=vX/velocityMagnitude;
			point.y=vY/velocityMagnitude;
			mtv.axis=new Vector(point.x,point.y);
		}
		dy=mtv.axis.y*mtv.overlap/3;
		dx=mtv.axis.x*mtv.overlap/3;
		if ((dx<0 && vX<0) || (dx>0 && vX>0)) 
			dx=-dx;
		if ((dy<0 && vY<0) || (dy>0 && vY>0))
			dy=-dy;
		shapeMove(shape,dx,dy);
		}	
	},

	// 精灵对象移动
	shapeMove=function  (shape,dx,dy) {
		shape.left+=dx;
		shape.top+=dy;
	},

	//更新精灵位置
	updatePlayerPosition=function  (shapes) {
		var currentShape,x,y;
		for (var i=0;i<shapes.length;i++) {
			currentShape=shapes[i];
			if (currentShape.name) {
				x=currentShape.left;
				y=currentShape.top;
				shapes[i].x=x;
				shapes[i].y=y;
			}
		}
	},

	//角度计算，精灵转向
	caculateAngle=function  (orientation,x,y) {
		var vX=orientation.x-x,
		vY=orientation.y-y,
		angle=Math.atan(vY/vX);
		if (orientation.x<x) angle=angle+Math.PI;
		return angle;
	},

	//随机单位向量
	randomVector=function  () {
		var x=Math.random(),
		y=Math.random(),
		vector=new Vector(x,y);
		return vector.normalize();
	};





// 模块/构造器

// 图片模块
var ImagesMode=function  () {
	// 图片加载
	this.imageLoadingProgressCallback;
	this.images={};
	this.imageUrls=[];
	this.imagesLoaded=0;
	this.imagesFailedToLoad=0;
	this.imagesIndex=0;
}

ImagesMode.prototype={
		// 图片加载
	imageReady:false,
	getImage: function  (imageUrl) {
		return this.images[imageUrl];
	},
	imageLoadedCallback: function  (e) {
		this.imagesLoaded++;
	},
	imageLoadErrorCallback: function (e) {
		this.imagesFailedToLoad++;
	},
	loadImage: function  (imageUrl) {
		var image=new Image(),
		me=this;
		image.src=imageUrl;
		image.addEventListener("load",function  (e) {
			me.imageLoadedCallback(e);
		});
		image.addEventListener("error",function  (e) {
			me.imageLoadErrorCallback(e);
		})
		this.images[imageUrl]=image;
	},
	loadImages: function  () {
		if (this.imagesIndex<this.imageUrls.length) {
			this.loadImage(this.imageUrls[this.imagesIndex]);
			this.imagesIndex++;
		}
		return Math.floor((this.imagesLoaded+this.imagesFailedToLoad)/this.imageUrls.length*100);
	},
	queueImage: function  (imageUrl) {
		this.imageUrls.push(imageUrl);
	}
}

// 音频模块
var SoundsMode=function  () {
	// 音频加载
	this.trigger=true;
	this.soundLoadingProgressCallback;
	this.sounds={};
	this.soundUrls=[];
	this.soundsLoaded=0;
	this.soundsFailedToLoad=0;
	this.soundsIndex=0;
}

SoundsMode.prototype={
	// 图片加载
	soundsReady:false,
	getSound: function  (soundUrl) {
		return this.sounds[soundUrl];
	},
	soundLoadedCallback: function  (e) {
		this.soundsLoaded++;
	},
	soundLoadErrorCallback: function (e) {
		this.soundsFailedToLoad++;
	},
	pause:function  (name) {
		var url="sounds/"+name+".ogg",
		sound=this.getSound(url);
		if (sound && !sound.paused) {
			sound.pause();
		} else {
			sound.play();
		}
	},
	mute:function  () {
		for (var i in this.sounds) {
			var sound=this.sounds[i];
			if(sound.duration>10) {
				if (sound.paused) sound.play();
				else sound.pause();
			} else 	sound.currentTime=0;	
		}
		this.trigger=!this.trigger;
	},
	play:function (name,loop) {
		if (this.trigger) {
			var url="sounds/"+name+".ogg",
			sound=this.getSound(url);
			if (sound) {
				sound.loop=loop;
				if (!sound.ended) {
					sound.currentTime=0;
					sound.play();
				}	
				else sound.play();
			}
		}
	},
	loadSound: function  (soundUrl) {
		var sound=new Audio(),
		me=this;
		sound.volume=0.3;
		sound.src=soundUrl;
		sound.addEventListener("canplay",function  (e) {
			me.soundLoadedCallback(e);
		});
		sound.addEventListener("error",function  (e) {
			me.soundLoadErrorCallback(e);
		})
		this.sounds[soundUrl]=sound;
	},
	loadSounds: function  () {
		if (this.soundsIndex<this.soundUrls.length) {
			this.loadSound(this.soundUrls[this.soundsIndex]);
			this.soundsIndex++;
		}
		return Math.floor((this.soundsLoaded+this.soundsFailedToLoad)/this.soundUrls.length*100);
	},
	queueSound: function  (soundUrl) {
		this.soundUrls.push(soundUrl);
	}
}

	// 最小平移向量
var	MinimumTranslationVector=function  (axis,overlap) {
		this.axis=axis;
		this.overlap=overlap;
	};

//精灵表构造器`````````````````````````````````

var	SpriteSheetPainter=function  (name,sprite,cells,spritesheet,interval,x,y,width,height) {
		this.name=name;
		this.sprite=sprite;
		this.cells=cells || [];
		this.cellIndex=0;
		this.spritesheet=spritesheet;
		this.x=x;
		this.y=y;
		this.width=width;
		this.height=height;
		this.isRunning=false;
		this.lastTime=0;
		this.interval=interval;
		this.angle=angle;
	};

SpriteSheetPainter.prototype={
	advance:function  (spriteSheets) {
		this.isRunning=true;
		if (this.cellIndex==this.cells.length-1) {
			delete spriteSheets[this.name];
			if (this.sprite.index) delete spriteSheets[this.name+this.sprite.index];
			this.isRunning=false;
			this.cellIndex=0;
		} else {
			this.cellIndex++;
		}
	},
	paint:function  (context) {
		var sprite=this.sprite,
			sLeft=sprite.left,
			sTop=sprite.top;
			context.save();
			context.beginPath();
			context.translate(sLeft,sTop);
			context.rotate(this.sprite.angle);
			for (var i=0;i<this.cells.length;i++) {
				var cell=this.cells[this.cellIndex];
				context.drawImage(this.spritesheet,cell.left,cell.top,cell.width,cell.height,this.x,this.y,this.width,this.height);
			}
			context.restore();	
	}
}

//计时器构造器 
var Timer=function  (game,duration,timeWarp) {
	this.game=game;
	this.timeWarp=timeWarp;
	this.duration=duration;
};
Timer.prototype={
	startTime:0,
	startedPauseAt:0,
	paused:false,
	pausedTime:0,
	running:false,
	effect:true,
	elapsed:undefined,
	start: function  () {
		this.game.timers.push(this);
		this.startTime=+new Date();
		this.running=true;
	},
	togglePaused: function  () {
		var now=getTimeNow();
		this.paused=!this.paused;
		if (this.paused) {
			this.startedPauseAt=now;
		} else {
			this.pausedTime+=now-this.startedPauseAt;
		}	
	},
	stop: function  () {
		this.elapsed=(+new Date())-this.startTime-this.pausedTime;
		this.running=false;
	},
	getElapsedTime: function  () {
		var elapsedTime;
			if (this.running) {
				elapsedTime=(+new Date())-this.startTime-this.pausedTime;
			} else {
				elapsedTime=this.elapsed;
			}
		var percentComplete=elapsedTime/this.duration;
		if (this.timeWarp==undefined) return elapsedTime;
		return elapsedTime*(this.timeWarp(percentComplete)/percentComplete);
	},
	isRunning: function  () {
		return this.running;
	},
	isComplete: function  () {
		var result=this.getElapsedTime()>this.duration;
		if (result) this.effect=false;
		return result;
	}
};

// 向量构造器
var Vector=function  (x,y) {
	this.x=x;
	this.y=y;
}

Vector.prototype={
	getMagnitude: function  () {
		return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2));
	},
	add: function  (vector) {
		var v=new Vector();
		v.x=this.x+vector.x;
		v.y=this.y+vector.y;
		return v;
	},
	subtract: function  (vector) {
		var v=new Vector();
		v.x=this.x-vector.x;
		v.y=this.y-vector.y;
		return v;
	},
	dotProduct: function  (vector) {
		return this.x*vector.x+this.y*vector.y;
	},
	edge: function  (vector) {
		return this.subtract(vector);
	},
	perpendicular: function  () {
		var v=new Vector();
		v.x=this.y;
		v.y=0-this.x;
		return v;
	},
	normalize: function  () {
		var v=new Vector(0,0),
		m=this.getMagnitude();
		if (m!=0) {
			v.x=this.x/m;
			v.y=this.y/m;
		}
		return v;
	},
	normal: function  () {
		var p=this.perpendicular();
		return p.normalize();
	}
};

//形状构造器
var Shape=function  () {
	this.x=undefined;
	this.y=undefined;
	this.strokeStyle="rgba(0,0,0,0)";
	this.fillStyle="rgba(0,0,0,0)";
};

Shape.prototype= {
	collidesWith: function  (shape) {
		var axis=shape.getAxes(),
		axes=this.getAxes().concat(axis);
		if (shape.getAxes()===undefined) return polygonCollidesWithCircle(this,shape);
		return !this.separationOnAxes(axes,shape);
	},
	separationOnAxes: function  (axes,shape) {
		for (var i=0;i<axes.length;i++) {
			var axis=axes[i],
			projection1=shape.project(axis),
			projection2=this.project(axis);
			if (!projection1.overlaps(projection2)) {
				return true;
			}
		}
		return false;
	},
	minimumTranslationVector: function  (axes,shape) {
		var minimumOverlap=10000,
		overlap,
		axisWithSmallestOverlap,
		projection1,projection2,
		axis;
		for (var i=0;i<axes.length;i++) {
			axis=axes[i];
			projection1=shape.project(axis);
			projection2=this.project(axis);

			if (projection1.max>projection2.max) overlap=projection2.max-projection1.min;
			else overlap=projection1.max-projection2.min;
			if (overlap===0) {
				return new MinimumTranslationVector(undefined,0);
			} else if (overlap<minimumOverlap) {
					minimumOverlap=overlap;
					axisWithSmallestOverlap=axis;
				}
		}
		return minimumOverlap<0?undefined:new MinimumTranslationVector(axisWithSmallestOverlap,minimumOverlap);
	},
	stroke: function  (context) {
		context.save();
		context.strokeStyle=this.strokeStyle;
		this.createPath(context);
		context.stroke();
		context.restore();
	},
	isPointInPath: function  (context,x,y) {
		this.createPath(context);
		return context.isPointInPath(x,y);
	}
}

// 投影构造器
var Projection=function  (min,max) {
	this.min=min;
	this.max=max;
};

Projection.prototype={
	overlaps: function  (projection) {
		return this.max>projection.min && projection.max>this.min;
	}
};

// 点构造器
var Pointer=function  (x,y) {
	this.x=x;
	this.y=y;
};

// 多边形构造器
var Polygon=function  () {
	this.points=[];
	this.strokeStyle="blue";
	this.fillStyle="white";
};

Polygon.prototype=new Shape();
Polygon.prototype.collidesWith=function  (shape) {
	if (shape.radius!==undefined) {
		return polygonCollidesWithCircle(this,shape);
	} else {

		return polygonCollidesWithPolygon(this,shpe);
	}
};
Polygon.prototype.getAxes=function  () {
	var v1=new Vector(),
	v2=new Vector(),
	axes=[];
	for (var i=0;i<this.points.length-1;i++) {
		v1.x=this.points[i].x;
		v1.y=this.points[i].y;
		v2.x=this.points[i+1].x;
		v2.y=this.points[i+1].y;
		axes.push(v1.edge(v2).normal());
	}
	v1.x=this.points[this.points.length-1].x;
	v1.y=this.points[this.points.length-1].y;
	v2.x=this.points[0].x;
	v2.y=this.points[0].y;
	axes.push(v1.edge(v2).normal());
	return axes;
};
Polygon.prototype.project= function  (axis) {
	var scalars=[],
	v=new Vector();
	this.points.forEach(function  (point) {
		v.x=point.x;
		v.y=point.y;
		scalars.push(v.dotProduct(axis));
	});
	return new Projection(Math.min.apply(Math,scalars),Math.max.apply(Math,scalars));
};
Polygon.prototype.addPoint=function  (x,y) {
	this.points.push(new Pointer(x,y));
};
Polygon.prototype.createPath=function (context) {
	if (this.points.length===0) return;
	context.beginPath();
	context.moveTo(this.points[0].x,this.points[0].y);
	for (var i=0;i<this.points.length;i++) {
		context.lineTo(this.points[i].x,this.points[i].y);
	}
	context.closePath();
};
Polygon.prototype.move= function  (dx,dy) {
	for (var i=0,point;i<this.points.length;i++) {
		point=this.points[i];
		point.x+=dx;
		point.y+=dy;
	}
}

//圆形构造器
var Circle= function  (x,y,radius) {
	this.x=x;
	this.y=y;
	this.radius=radius;
}

Circle.prototype=new Shape();
Circle.prototype.collidesWith= function  (shape) {
	var axes=shape.getAxes(),
	distance;
	//与圆碰撞
	if (axes===undefined) {
		return circleCollidesWithCircle(this,shape);
	} else {
	//与多边形碰撞
		return polygonCollidesWithCircle(shape,this);
	}
}
Circle.prototype.getAxes=function  () {
	return undefined;
};
Circle.prototype.project= function  (axis) {
	var scalars=[],
	dotProduct=new Vector(this.x,this.y).dotProduct(axis);
	scalars.push(dotProduct);
	scalars.push(dotProduct+this.radius);
	scalars.push(dotProduct-this.radius);
	return new Projection(Math.min.apply(Math,scalars),Math.max.apply(Math,scalars));
};
Circle.prototype.move=function  (dx,dy) {
	this.x+=dx;
	this.y+=dy;
};
Circle.prototype.createPath= function  (context) {
	context.beginPath();
	context.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
};


// 精灵构造器
var Sprite= function  (name,context,painter,behaviors) {
	this.name=name;
	this.painter=painter;
	this.behaviors=behaviors || [];
	this.left=0;
	this.top=0;
	this.width=30;
	this.height=30;
	this.radius=15;
	this.life=40;
	this.totalLife=40;
	this.index=0;
	this.angle=undefined;
	this.freeze=false;
	this.exist=true;
	var sprite=this;
}

Sprite.prototype=new Circle(200,200,15);

Sprite.prototype.paint=function  (context) {
		return this.painter.paint(context);
	};
Sprite.prototype.update=function  (sprite,time) {
		if (this.exist) {
			for (var i=0;i<this.behaviors.length;i++) {
				this.behaviors[i].execute(sprite,time);
			}
		}
	}

// 游戏构造器
var Game=function  (gameName,canvasId) {
	var canvas=document.getElementById(canvasId),
	me=this;
	this.context=canvas.getContext("2d");
	this.gameName=gameName;
	this.gameOver=false;
	this.sprites=[];
	this.keyListeners=[];
	this.keys={};

	

	// 时间
	this.startTime=0;
	this.lastTime=0;
	this.gameTime=0;
	this.fps=0;
	this.STARTING_FPS=60;
	this.timers=[];

	this.paused=false;
	this.startedPauseAt=0;
	this.PAUSE_TIMEOUT=100;

	//鼠标移动
	this.mouse={x:0,y:0};

	window.onkeydown= function  (e) {me.keyDown(e)};
	window.onkeyup= function  (e) {me.keyUp(e)};
	return this;
}

Game.prototype= {

	// 游戏循环
	start: function  () {
		var me=this;
		this.startTime=getTimeNow();
		window.requestAnimationFrame(function (time) {
			me.animate.call(me,time);
		});
	},
	animate: function  (time) {
		var me=this;
		if (this.paused) {
			setTimeout(function  () {
				me.animate.call(me,time);
			},this.PAUSE_TIMEOUT);
		} else {
			this.tick(time);
			this.clearScreen();
			this.startAnimate(time);
			this.paintUnderSprites();
			this.updateSprites(time);
			this.paintSprites();
			this.paintOverSprites();
			this.endAnimate();
		
		 window.requestAnimationFrame(function  (time) {
			me.animate.call(me,time);
		});
		}	
	},
	tick: function  (time) {
		this.updateFrameRate(time);
		this.gameTime=(getTimeNow())-this.startTime;
		this.lastTime=time;
	},
	updateFrameRate: function  (time) {
		if (this.lastTime==0) this.fps=this.STARTING_FPS;
		else {
			var fpsMaybe=1000/(time-this.lastTime);
			if (fpsMaybe>0 &&fpsMaybe>this.STARTING_FPS/1.5) this.fps=1000/(time-this.lastTime);
		}
	},
	clearScreen: function  () {
		this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);
	},

	togglePaused: function  () {
		var now=getTimeNow();
		this.paused=!this.paused;
		if (this.paused) {
			this.startedPauseAt=now;
		} else {
			this.startTime=this.startTime+now-this.startedPauseAt;
			this.lastTime=now;
		}
		for (var i=0;i<this.timers.length;i++) {
			this.timers[i].togglePaused();
		}
	},
	pixelsPerFrame: function  (velocity) {
		return velocity/this.fps;
	},

	// 按键监听
	addKeyListener: function  (keyAndListener) {
		this.keyListeners.push(keyAndListener);

	},
	findKeyListener: function  (key) {
		var listener;
		for (var i=0;i<this.keyListeners.length;i++) {
			var keyAndListener=this.keyListeners[i],
			currentKey=keyAndListener.key;
			if (currentKey===key) listener=keyAndListener.listener;
		};
		return listener;
	},
	keyDown: function  (e) {
		var key=e.keyCode,listener;
			this.keys[key]=key;
	},
	keyUp: function  (e) {
		delete this.keys[e.keyCode];
	},
	keyListener: function  () {
		var listener;
		for (i in this.keys) {
			listener=this.findKeyListener(this.keys[i]);
			if (listener) listener();
		}
	},
	//鼠标移动
	mousemove: function (e) {
		this.mouse=windowToCanvas(e.clientX,e.clientY);	
	},

	// 声音  

	// sprite
	addSprite: function  (sprite) {
		this.sprites.push(sprite);
	},
	getSprite: function (name) {
		for (i in this.sprites) {
			if (this.sprites[i].name===name) return this.sprites[i];
		}
		return null;
	},
	removeSprite: function  (sprite) {
		for (i in this.sprites) {
			if (this.sprites[i].index==sprite.index) delete this.sprites[i];
		}
	},
	
	updateSprites: function  (time) {
		for (var i=0;i<this.sprites.length;i++) {
			var sprite=this.sprites[i];
			if (sprite!==undefined) sprite.update(sprite,time);
		}
	},
	paintSprites: function  (time) {
		for (var i=0;i<this.sprites.length;i++) {
			var sprite=this.sprites[i];
			if (sprite!==undefined) sprite.paint(this.context);
		}
	}
}
	return {
		drawBackground:drawBackground,
		getTimeNow:getTimeNow,
		$:$,
		windowToCanvas:windowToCanvas,
		drawShape:drawShape,
		getPolygonPointClosetToCircle:getPolygonPointClosetToCircle,
		polygonCollidesWithCircle:polygonCollidesWithCircle,
		polygonCollidesWithPolygon:polygonCollidesWithPolygon,
		circleCollidesWithCircle: circleCollidesWithCircle,
		separate:separate,
		shapeMove:shapeMove,
		updatePlayerPosition:updatePlayerPosition,
		caculateAngle: caculateAngle,
		randomVector:randomVector,
		ImagesMode:ImagesMode,
		SoundsMode:SoundsMode,
		SpriteSheetPainter:SpriteSheetPainter,
		Timer:Timer,
		Vector:Vector,
		Shape:Shape,
		Projection:Projection,
		Pointer:Pointer,
		Polygon:Polygon,
		Circle:Circle,
		Sprite:Sprite,
		Game:Game
	};
})()