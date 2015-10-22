
var MoveAgent = function(options){

  var config = {
    maxVelocity:1,
    maxForce:.5,
    maxAvoidAhead:10,
    avoidanceForce:40,
    slowingRadius:20,
    wanderDistance:50,
    wanderAngle : Math.random() * 360,
    wanderRadius:20,
    wanderAngleChange:30,
  };
  for (var i in options) config[i] = options[i]; 

  var f = new Point(),
      position,
      velocity;

  return{
    setOptions:function(o){
      for (var i in o) config[i] = o[i];
    },
    start:function(p,v){
      f.length = 0;
      position = p;
      velocity = v;
    },
    calculate:function(){
      f=steering.limit(f,config.maxForce);
      velocity = steering.limit(velocity + f,config.maxVelocity);
      return position + velocity
    },
    wander:function(){
      config.wanderAngle += (Math.random()*config.wanderAngleChange)-(config.wanderAngleChange*.5);
      f += steering.wander(velocity,config.wanderDistance,config.wanderRadius,config.wanderAngle);
    },
    straight:function(target){
      f += steering.straight(target.position,position);
    },
    arrive:function(target){
      f += steering.seek(target.position,position,velocity,
                         config.maxVelocity, config.slowingRadius);
    },
    flee:function(target){
      f += steering.flee(target.position,position,
                         velocity,config.maxVelocity);
    },
    evade:function(target){
      f += steering.evade(target.position,position,config.maxVelocity,
                          velocity,target.velocity);
    },
    pursuit:function(target){
      f += steering.pursuit(target.position,position,config.maxVelocity,
                            velocity,target.velocity,config.slowingRadius);
    },
    avoid:function(target,radius){
      f += steering.avoidance(target.position,radius,position,velocity,
                              config.maxAvoidAhead,config.maxVelocity,config.avoidanceForce);
    },
    keepInBounds:function(rect){
      if (!rect.contains(position)){
        f = (rect.center - position).normalize(config.maxVelocity);
      } 
    },
  }
}

var Brain = function(self,options){

  var config = {
    food : [],
    feared : [],
    neutral : [],
    moveAgent : null,
  };
  for (var i in options) config[i] = options[i];
  
  
  var moveAgent = new MoveAgent(config.moveAgent),
      foodInSight = [],
      fearedInSight = [],
      neutralInSight = [];
  
  function processVision(){
    foodInSight.length = 0;
    fearedInSight.length = 0;
    neutralInSight.length = 0;
    
    for (var i in self.vision.visibleUnits){
      var u = self.vision.visibleUnits[i];
      if (config.feared.indexOf(u.type) > -1) fearedInSight.push(u);
      if (config.food.indexOf(u.type) > -1) foodInSight.push(u);
      if (config.neutral.indexOf(u.type) > -1) neutralInSight.push(u);
    }
  };

  function move(){
    moveAgent.start(self.position,self.velocity);
    
    var wander = true;
    
    for (var i in neutralInSight){
      var distance = 10;
      moveAgent.avoid(neutralInSight[i],distance);
    }
    
    for (var i in fearedInSight){
      wander = false;
      moveAgent.evade(fearedInSight[i]);
    }
    for (var i in foodInSight){
      wander = false;
      moveAgent.pursuit(foodInSight[i]);
    }
    if (wander) moveAgent.wander();
    moveAgent.keepInBounds(new Rectangle(0,0,600,600));
    
    self.position = moveAgent.calculate();
  };  
  
  return {
    setOptions:function(o){
      for (var i in o) {config[i] = o[i];}
    },
    update:function(){
      processVision();
      move();
    }
  };
}

var Vision = function(self,options){
  var config = {
    radius:50,
    draw:true,
  }; 
  for (var i in options) config[i] = options[i];
 
  var visionCircle = new Path.Circle({
                     center:self.position,
                     radius:config.radius,
                     strokeWidth:1
                   });
  return {
    visionRadius : config.radius,
    visibleUnits : [],
    update : function(){
      //Look for units in sight
      this.visibleUnits.length = 0;
      for (var i in units){
        var u = units[i],
            p2 = units[i].position,
            p1 = self.position;
        if (u!==self && ((p2-p1).length < config.radius)){
          this.visibleUnits.push(u);
        }
      }
      
      //Draw vision circle
      if (config.draw){
        visionCircle.visible = true;
        if (this.visibleUnits.length > 0) visionCircle.strokeColor = new Color(0,1,0,.5);
        else visionCircle.strokeColor = new Color(0,0,0,.1);
        visionCircle.position = self.position;
      }
      else{
        visionCircle.visible = false;
      }
    }
  };  

}

var Unit = function(options){  
  var config = {
    name : "unknown",
    type : "unit",
    enabled : true,
    position : view.center,
    velocity : new Point(),
    brain : null,
    vision : null,
  }
  
  for (var i in options) config[i] = options[i];

  this.type = config.type;
  this.position = config.position;
  this.velocity = config.velocity;
  this.enabled = config.enabled;
  this.drawable = new Path.Circle(
    {center:this.position,radius:3,fillColor:'red'}
  )
  
  //Components
  this.brain = new Brain(this,config.brain);
  this.vision = new Vision(this,config.vision);

  this.update = function(){
    if (this.enabled){
      if (this.vision) this.vision.update();
      if (this.brain) this.brain.update();
    }
    this.drawable.position = this.position;
    this.drawable.rotation = this.velocity.angle;
  };
  
  config = null;

};

var units = [];
for (var i =0; i < 100; i++){
  
  var u = new Unit({
    position:Point.random() * 600,
    vision:{
      radius:60,
    },
    brain:{
      food:['hunter'],
      neutral:['unit'],
      moveAgent:{
        maxVelocity:Math.random()+.1,
        maxForce:Math.random()+.1,
      }
    }
  });

  units.push(u);
};

function onFrame(event){
  if ((Date.now() - lastMoveTime) >= 100)
    hunter.velocity.length = 0;
  for (var i in units){
    units[i].update();
  }
}

//Mouse interaction
var lastMoveTime = Date.now();
var hunter = new Unit();
hunter.enabled = false;
hunter.type = "hunter";
units.push(hunter);

function onMouseMove(event){
  hunter.position = event.point;
  hunter.velocity = event.delta;
  lastMoveTime = Date.now();
}
