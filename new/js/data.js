// 保存游戏运行中的一些数据，dom操作用到的属性，动画cell


var fpsTrigger=true,    //性能监测
shadowTrigger=true,		//阴影开关
bodyInterval=0,			//残骸刷新间隔，0为不刷新
soundTrigger=true,		//音量开关
angle,					//角度
pA,						//人物属性加成配置 除了枪支 playerAttributes缩写
weapon,					//储存武器
bullets=[];				//储存飞行中的子弹


// 侧边属性按钮
var triggerAttribute={
	0:{execute:function  () {
		fpsTrigger=!fpsTrigger;
		var monitor=engine.$("f-monitor");
		if (fpsTrigger) {
			monitor.style.backgroundColor="#34d12c";
			monitor.dataset.attribute="开";
		} else {
			monitor.style.backgroundColor="#f21a2e";
			monitor.dataset.attribute="关";
		}
	}},
	1:{execute:function  () {
		soundTrigger=!soundTrigger;
		var monitor=engine.$("f-sound");
		if (soundTrigger) {
			mode.sounds.mute();
			monitor.style.backgroundColor="#34d12c";
			monitor.dataset.attribute="开";
		} else {
			mode.sounds.mute();
			monitor.style.backgroundColor="#f21a2e";
			monitor.dataset.attribute="关";
		}
	}},
	2:{execute:function  () {
		shadowTrigger=!shadowTrigger;
		var monitor=engine.$("f-shadow");
		if (shadowTrigger) {
			monitor.style.backgroundColor="#34d12c";
			monitor.dataset.attribute="开";
		} else {
			monitor.style.backgroundColor="#f21a2e";
			monitor.dataset.attribute="关";	
		}
	}},
	3:{execute:function  () {
		var monitor=engine.$("f-body");
		if (bodyInterval==0) {
			bodyInterval=2000;
			monitor.style.backgroundColor="#34d12c";
			monitor.dataset.attribute="开";	
		} else {
			bodyInterval=0;
			monitor.style.backgroundColor="#f21a2e";
			monitor.dataset.attribute="关";			
		}
	}}
};


function attInitialize () {
	pA={speedRecover:3000,lifeRecover:500,runSpeed:80,life:40,fightBack:0,dodge:1,recoverAtt:{speedTrigger:true,speedRecover:3000,lifeTrigger:false,lifeRecover:2500,lastLifeRecover:0},
	standLuAtt:{trigger:false,x:undefined,y:undefined,lastTime:undefined},doctorAtt:{trigger:false,percentage:0.12},freezeTrigger:false,xuanmaiTrigger:false};
	weapon={name:"手枪",speed:20,rate:400,offset:Math.PI/70,ammo:10,reloadTime:1000,ATK:{min:10,max:30},pierce:1,shrapnel:0};
}

var talentBkg={	
	0:{left:0,top:-100,left1:0,top1:0,title:"爆头",content:"你痴迷于爆头的快感，这种执着无疑会加强你子弹的攻击力与击退效果",attribute:function  (level) {
	var min=weapon.ATK.min,
	max=weapon.ATK.max;	
	switch(level) {
		case 1:{weapon.ATK.min=min*1.1;weapon.ATK.max=max*1.1;}break;
		case 2:{weapon.ATK.min=min*1.3;weapon.ATK.max=max*1.25;}break;
	}
}},
1:{left:-50,top:-100,left1:-50,top1:0,title:"双刃剑",content:"你全身心的投入战斗，带来更大伤害的同时承受更多伤害",attribute:function  (level) {
	weapon.ATK.min=weapon.ATK.min*1.3;
	weapon.ATK.max=weapon.ATK.max*1.5;
	pA.fightBack+=15;
	pA.life=pA.life*0.7;
}},
2:{left:-100,top:-100,left1:-100,top1:0,title:"子母弹片",content:"你的子弹含有更多弹片，虽然减少了伤害却能波及更大范围",attribute:function  (level) {
	weapon.ATK.min=weapon.ATK.min*0.85;
	weapon.ATK.max=weapon.ATK.max*0.9;
	weapon.shrapnel=Math.ceil((weapon.shrapnel+1)*1.1);
}},
3:{left:-150,top:-100,left1:-150,top1:0,title:"移动堡垒",content:"只要停止移动一会儿你的怒火就会向四面八方宣泄",attribute:function  (level) {
	pA.standLuAtt.trigger=true;
}},
4:{left:-200,top:-100,left1:-200,top1:0,title:"霰弹枪",content:"极少的装弹时间，极高的攻击覆盖面与击退效果",attribute:function  (level) {
	return {name:"霰弹枪",speed:30,rate:850,offset:Math.PI/8,ammo:1,reloadTime:750,ATK:{min:10,max:70},pierce:2,shrapnel:20}
}},
10:{left:-250,top:-100,left1:-250,top1:0,title:"有氧爱好者",content:"你的心肺功能卓越，你跑得更快，被攻击也能更快恢复速度",attribute:function  (level) {
	switch(level) {
		case 1:{pA.runSpeed+=10;pA.speedRecover=2000;}break;
		case 2:{pA.runSpeed+=15;pA.speedRecover=500;}break;
	}
}},
11:{left:-300,top:-100,left1:-300,top1:0,title:"广场舞之魂",content:"你敏捷的舞步使你更易闪避攻击",attribute:function  (level) {
	pA.dodge=0.7;
}},
12:{left:-350,top:-100,left1:-350,top1:0,title:"迅捷装弹",content:"你掌握了快速装弹的技巧，这无疑能加强你的战场生存能力",attribute:function  (level) {
	weapon.reloadTime=weapon.reloadTime*0.7;
}},
13:{left:0,top:-150,left1:0,top1:-50,title:"命运",content:"怪物的攻击不会让你损失生命，但会有一定几率直接死亡",attribute:function  (level) {
	pA.life=10000;
	pA.doctorAtt.trigger=true;
}},
14:{left:-50,top:-150,left1:-50,top1:-50,title:"狙击步枪",content:"极高的攻击力与穿透能力，弹道稳定",attribute:function  (level) {
	return {name:"狙击步枪",speed:30,rate:400,offset:Math.PI/30,ammo:6,reloadTime:1500,ATK:{min:30,max:60},pierce:4,shrapnel:0}
}},
20:{left:-100,top:-150,left1:-100,top1:-50,title:"举铁能人",content:"你厚实的肌肉使你的防御力、恢复能力、抵御后座力能力更强",attribute:function  (level) {
		switch(level) {
			case 1:{pA.life+=14;weapon.offset=weapon.offset*0.8;pA.recoverAtt.lifeTrigger=true;}break;
			case 2:{pA.life+=22;weapon.offset=weapon.offset*0.4;pA.recoverAtt.lifeTrigger=true;pA.recoverAtt.lifeRecover=2100;}break;
		}
}},
21:{left:-150,top:-150,left1:-150,top1:-50,title:"近战先生",content:"面对攻击你的怪物，血性如你立刻挥拳反击",attribute:function  (level) {
	pA.fightBack+=20;
}},
22:{left:-200,top:-150,left1:-200,top1:-50,title:"眩晕子弹",content:"你的子弹附带眩晕效果，会使命中的怪物原地打转",attribute:function  (level) {
	pA.freezeTrigger=true;
}},
23:{left:-250,top:-150,left1:-250,top1:-50,title:"血性射击",content:"用付出鲜血的方式使你获得装弹时间也能射击的能力",attribute:function  (level) {
	pA.xuanmaiTrigger=true;
}},
24:{left:-300,top:-150,left1:-300,top1:-50,title:"突击步枪",content:"极高的射速，高弹夹容量，适中的稳定性",attribute:function  (level) {
	return {name:"突击步枪",speed:25,rate:120,offset:Math.PI/30,ammo:25,reloadTime:1100,ATK:{min:15,max:25},pierce:1,shrapnel:0}
}}
},

playerBodyCell=[{left:80,top:70,width:220,height:220}],

//腿部奔跑动画
runCell=[{left:0,top:407,width:213,height:107},
		{left:213,top:407,width:213,height:107},
		{left:426,top:407,width:213,height:107},
		{left:639,top:407,width:213,height:107},
		{left:852,top:407,width:213,height:107},
		{left:1065,top:407,width:213,height:107},
		{left:1278,top:407,width:213,height:107},
		{left:1491,top:407,width:213,height:107},
		{left:1704,top:407,width:213,height:107},
		{left:0,top:557,width:213,height:107},
		{left:213,top:557,width:213,height:107},
		{left:426,top:557,width:213,height:107},
		{left:639,top:557,width:213,height:107},
		{left:852,top:557,width:213,height:107},
		{left:1065,top:557,width:213,height:107},
		{left:1278,top:557,width:213,height:107}],

//射击枪火
 gunfireCell=[{left:0,top:795,width:116,height:77},
				{left:117,top:795,width:116,height:77},
				{left:234,top:795,width:116,height:77},
				{left:351,top:795,width:116,height:77}
				],

//Z				
zombieCell=[{left:0,top:921,width:48,height:27},
			{left:48,top:921,width:48,height:27},
			{left:144,top:921,width:48,height:27},
			{left:192,top:921,width:48,height:27},
			{left:240,top:921,width:48,height:27},
			{left:288,top:921,width:48,height:27},
			{left:0,top:950,width:48,height:27},
			{left:48,top:950,width:48,height:27},
			{left:144,top:950,width:48,height:27},
			{left:192,top:950,width:48,height:27},
			{left:240,top:950,width:48,height:27},
			{left:288,top:950,width:48,height:27},
			{left:0,top:977,width:48,height:27},
			{left:48,top:977,width:48,height:27},
			{left:144,top:977,width:48,height:27},
			{left:192,top:977,width:48,height:27},
			{left:240,top:977,width:48,height:27},
			{left:288,top:977,width:48,height:27}],
		

zombieDieCell=[{left:0,top:1035,width:58,height:53},
					{left:58,top:1035,width:58,height:53},
					{left:116,top:1035,width:58,height:53},
					{left:174,top:1035,width:58,height:53},
					{left:232,top:1035,width:58,height:53},
					{left:290,top:1035,width:58,height:53},
					{left:348,top:1035,width:58,height:53},
					{left:0,top:1088,width:58,height:53},
					{left:58,top:1088,width:58,height:53},
					{left:116,top:1088,width:58,height:53},
					{left:174,top:1088,width:58,height:53},
					{left:232,top:1088,width:58,height:53},
					{left:290,top:1088,width:58,height:53},
					{left:348,top:1088,width:58,height:53},
					{left:0,top:1141,width:58,height:53},
					{left:58,top:1141,width:58,height:53},
					{left:116,top:1141,width:58,height:53},
					{left:174,top:1141,width:58,height:53},
					{left:232,top:1141,width:58,height:53},
					{left:290,top:1141,width:58,height:53},
					{left:348,top:1141,width:58,height:53},
					{left:0,top:1194,width:58,height:53}];							

// 蜥蜴
var lizardCell=[{left:483,top:921,width:63,height:35},
				{left:546,top:921,width:63,height:35},
				{left:609,top:921,width:63,height:35},
				{left:672,top:921,width:63,height:35},
				{left:735,top:921,width:63,height:35},
				{left:798,top:921,width:63,height:35},
				{left:861,top:921,width:63,height:35},
				{left:483,top:955,width:63,height:35},
				{left:546,top:955,width:63,height:35},
				{left:609,top:955,width:63,height:35},
				{left:672,top:955,width:63,height:35},
				{left:735,top:955,width:63,height:35},
				{left:798,top:955,width:63,height:35},
				{left:861,top:955,width:63,height:35},
				{left:483,top:990,width:63,height:35},
				{left:546,top:990,width:63,height:35},
				{left:609,top:990,width:63,height:35},
				{left:672,top:990,width:63,height:35},
				{left:735,top:990,width:63,height:35},
				{left:798,top:990,width:63,height:35},
				{left:861,top:990,width:63,height:35}
				],

	lizardDieCell=[{left:483,top:1025,width:63,height:46},
				{left:546,top:1025,width:63,height:46},
				{left:609,top:1025,width:63,height:46},
				{left:672,top:1025,width:63,height:46},
				{left:746,top:1025,width:63,height:46},
				{left:798,top:1025,width:63,height:46},
				{left:861,top:1025,width:63,height:46},
				{left:483,top:1071,width:63,height:46},
				{left:546,top:1071,width:63,height:46},
				{left:609,top:1071,width:63,height:46},
				{left:672,top:1071,width:63,height:46},
				{left:746,top:1071,width:63,height:46},
				{left:798,top:1071,width:63,height:46},
				{left:861,top:1071,width:63,height:46},
				{left:493,top:1117,width:63,height:46},
				{left:556,top:1117,width:63,height:46},
				{left:619,top:1117,width:63,height:46},
				{left:682,top:1117,width:63,height:46},
				{left:756,top:1117,width:63,height:46},
				{left:798,top:1117,width:63,height:46},
				{left:861,top:1117,width:63,height:46}];

// 蜘蛛
var spiderCell=[{left:957,top:921,width:67,height:48},
				{left:1024,top:921,width:67,height:48},
				{left:1091,top:921,width:67,height:48},
				{left:1158,top:921,width:67,height:48},
				{left:1225,top:921,width:67,height:48},
				{left:1292,top:921,width:67,height:48},
				{left:1359,top:921,width:67,height:48},
				{left:957,top:968,width:67,height:48},
				{left:1024,top:968,width:67,height:48},
				{left:1091,top:968,width:67,height:48},
				{left:1158,top:968,width:67,height:48},
				{left:1225,top:968,width:67,height:48},
				{left:1292,top:968,width:67,height:48},
				{left:1359,top:968,width:67,height:48},
				{left:957,top:1016,width:67,height:48},
				{left:1024,top:1016,width:67,height:48},
				{left:1091,top:1016,width:67,height:48},
				{left:1158,top:1016,width:67,height:48},
				{left:1225,top:1016,width:67,height:48},
				{left:1292,top:1016,width:67,height:48},
				{left:1359,top:1016,width:67,height:48}  
				],

	spiderDieCell=[{left:957,top:1064,width:67,height:48},
				{left:1024,top:1064,width:67,height:48},
				{left:1091,top:1064,width:67,height:48},
				{left:1158,top:1064,width:67,height:48},
				{left:1225,top:1064,width:67,height:48},
				{left:1292,top:1064,width:67,height:48},
				{left:1359,top:1064,width:67,height:48},
				{left:957,top:1112,width:67,height:48},
				{left:1024,top:1112,width:67,height:48},
				{left:1091,top:1112,width:67,height:48},
				{left:1158,top:1112,width:67,height:48},
				{left:1225,top:1112,width:67,height:48},
				{left:1292,top:1112,width:67,height:48},
				{left:1359,top:1112,width:67,height:48},
				{left:957,top:1160,width:67,height:48},
				{left:1024,top:1160,width:67,height:48},
				{left:1091,top:1160,width:67,height:48},
				{left:1158,top:1160,width:67,height:48},
				{left:1225,top:1160,width:67,height:48},
				{left:1292,top:1160,width:67,height:48},
				{left:1359,top:1160,width:67,height:48}];


// boss
var bossCell=[{left:1426,top:921,width:65,height:48},
				{left:1491,top:921,width:65,height:48},
				{left:1556,top:921,width:65,height:48},
				{left:1621,top:921,width:65,height:48},
				{left:1686,top:921,width:65,height:48},
				{left:1751,top:921,width:65,height:48},
				{left:1816,top:968,width:65,height:48},
				{left:1426,top:968,width:65,height:48},
				{left:1491,top:968,width:65,height:48},
				{left:1556,top:968,width:65,height:48},
				{left:1621,top:968,width:65,height:48},
				{left:1686,top:968,width:65,height:48},
				{left:1751,top:968,width:65,height:48},
				{left:1816,top:968,width:65,height:48},
				{left:1426,top:1016,width:65,height:48},
				{left:1491,top:1016,width:65,height:48},
				{left:1556,top:1016,width:65,height:48},
				{left:1621,top:1016,width:65,height:48},
				{left:1686,top:1016,width:65,height:48},
				{left:1751,top:1016,width:65,height:48},
				{left:1816,top:1016,width:65,height:48} 
				],

	bossDieCell=[{left:1426,top:1064,width:65,height:48},
				{left:1491,top:1064,width:65,height:48},
				{left:1556,top:1064,width:65,height:48},
				{left:1621,top:1064,width:65,height:48},
				{left:1686,top:1064,width:65,height:48},
				{left:1751,top:1064,width:65,height:48},
				{left:1816,top:1064,width:65,height:48},
				{left:1426,top:1112,width:65,height:48},
				{left:1491,top:1112,width:65,height:48},
				{left:1556,top:1112,width:65,height:48},
				{left:1621,top:1112,width:65,height:48},
				{left:1686,top:1112,width:65,height:48},
				{left:1751,top:1112,width:65,height:48},
				{left:1816,top:1112,width:65,height:48},
				{left:1426,top:1160,width:65,height:48},
				{left:1491,top:1160,width:65,height:48},
				{left:1556,top:1160,width:65,height:48},
				{left:1621,top:1160,width:65,height:48},
				{left:1686,top:1160,width:65,height:48},
				{left:1751,top:1160,width:65,height:48},
				{left:1816,top:1160,width:65,height:48}],


deadBodyCell=[[{left:0,top:1194,width:58,height:53}],
			[{left:861,top:1117,width:63,height:46}],
			[{left:1359,top:1160,width:67,height:48}],
			[{left:1816,top:1160,width:65,height:48}],
			[{left:0,top:1194,width:58,height:53}],
			[{left:861,top:1117,width:63,height:46}],
			[{left:1359,top:1160,width:67,height:48}],
			[{left:1816,top:1160,width:65,height:48}]],

playerDeadCell=[{left:414,top:78,width:64,height:63},
				{left:478,top:78,width:64,height:63},
				{left:542,top:78,width:64,height:63},
				{left:606,top:78,width:64,height:63},
				{left:670,top:78,width:64,height:63},
				{left:734,top:78,width:64,height:63},
				{left:798,top:78,width:64,height:63},
				{left:414,top:141,width:64,height:63},
				{left:478,top:141,width:64,height:63},
				{left:542,top:141,width:64,height:63},
				{left:606,top:141,width:64,height:63},
				{left:670,tzop:141,width:64,height:63},
				{left:734,top:141,width:64,height:63},
				{left:798,top:141,width:64,height:63},
				{left:414,top:204,width:64,height:63},
				{left:478,top:204,width:64,height:63},
				{left:542,top:204,width:64,height:63},
				{left:606,top:204,width:64,height:63},
				{left:670,top:204,width:64,height:63},
				{left:734,top:204,width:64,height:63},
				{left:798,top:204,width:64,height:63}]

