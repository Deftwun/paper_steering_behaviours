
var Spatial = function(p,v){
  return{
    position:p ? p : new Point(),
    velocity:v ? v : new Point()
  }
}

var MoveAgent = function(spatial,options){

  var defaultOptions = {
    maxVelocity:.1,
    maxForce:.05,
    maxAvoidAhead:50,
    avoidanceForce:40,
    slowingRadius:20,
    wanderDistance:50,
    wanderAngle : Math.random() * 360,
    wanderRadius:20,
    wanderAngleChange:30,
  }
  
  var options = options ? options : defaultOptions;
  var f = new Point();

  return{
    reset:function(){f.length = 0},
    
    update: function(){
      f=steering.limit(f,options.maxForce);
      spatial.velocity = steering.limit(spatial.velocity + f,options.maxVelocity);
      spatial.position = spatial.position + spatial.velocity;
      this.reset();
    },
    wander:function(){
      options.wanderAngle += (Math.random()*options.wanderAngleChange)-(options.wanderAngleChange*.5);
      f += steering.wander(spatial.velocity,options.wanderDistance,options.wanderRadius,options.wanderAngle);
    },
    straight:function(target){
      f += steering.straight(target.position,spatial.position);
    },
    arrive:function(target){
      f += steering.seek(target.position,spatial.position,spatial.velocity,
                         options.maxVelocity, options.slowingRadius);
    },
    flee:function(target){
      f += steering.flee(target.position,spatial.position,
                         spatial.velocity,options.maxVelocity);
    },
    evade:function(target){
      f += steering.evade(target.position,spatial.position,options.maxVelocity,
                          spatial.velocity,target.velocity);
    },
    pursuit:function(target){
      f += steering.pursuit(target.position,spatial.position,options.maxVelocity,
                            spatial.velocity,target.velocity,options.slowingRadius);
    },
    avoid:function(target,radius){
      f += steering.avoidance(target.position,radius,spatial.position,spatial.velocity,
                              options.maxAvoidAhead,options.maxVelocity,options.avoidanceForce);
    }    
  }
}

var Unit = function(pos){

  var spatial = new Spatial(pos ? pos : view.center),
      moveAgent = new MoveAgent(spatial),
      drawable = new Group();
      
  var body = new Path.Circle(spatial.position, 3);
  body.fillColor = new Color(1,0,0);
  
  var vision = new Path.Circle(spatial.position,50);    
  vision.strokeWidth = 1;
  vision.strokeColor = new Color(0,0,0,.1);
  
  drawable.addChildren([body,vision]);

  return{
    vision: vision,
    drawable:drawable,
    spatial:spatial,
    update: function(){

      moveAgent.wander();
      moveAgent.update();
      
      drawable.position = spatial.position;
      drawable.rotation = spatial.velocity.angle;
    },
  }
};

var units = [];
for (var i =0; i < 10; i++){
  var u = new Unit(view.center);
  units.push(u);
};

var lastMoveTime = Date.now();
var p = new Spatial();

function onMouseMove(event){
  p.position = event.point;
  p.velocity = event.delta;
  lastMoveTime = Date.now();
}

function onFrame(event){
  if ((Date.now() - lastMoveTime) >= 100)
    p.velocity.length = 0;
  for (var i in units){
    units[i].update();
  }

}
