window.steering = {

  limit : function(vec,length){
    if (vec.length > length) return vec.normalize(length);
    else return vec;
  },
  
  straight : function(target, position){
    var f = target - position;
    return f.normalize();
  },

  seek : function(target, position, current_velocity, max_velocity, slowing_radius){  
    var desired = target - position; 
    distance = desired.length;
    desired = desired.normalize();
    if (distance <= slowing_radius) {
      desired = desired * (max_velocity * (distance/slowing_radius));
    } else {
      desired = desired * max_velocity;
    }
    force = desired - current_velocity;
    return force;
  },

  flee : function(target, position, current_velocity, max_velocity){
    var desired = position - target;
    desired = desired.normalize(max_velocity);
    force = desired - current_velocity;
    return force;
  },

  wander : function(current_velocity, wander_distance, wander_radius, wander_angle){
    //You must vary wander_angle yourself outside of this function to create random movement
    var circleCenter = current_velocity.normalize() * wander_distance;
    var displacement = new Point(0, -1);
    displacement = displacement * wander_radius;
    displacement.angle = wander_angle;
    wanderForce = circleCenter + displacement;
    return wanderForce;
  },

  evade : function(target, position, max_velocity, current_velocity, target_velocity){
    var d = target-position,
        t = d.length / max_velocity,
        futurePosition = target + (target_velocity * t);
    return this.flee(futurePosition, position, current_velocity, max_velocity);
  },

  pursuit : function(target, position, max_velocity, current_velocity, target_velocity,slowing_radius){
    var d = (target - position).length,
        t = d / max_velocity,
        futurePosition = target + (target_velocity * t);        
    return this.seek(futurePosition, position, current_velocity, max_velocity, slowing_radius);
  },

  avoidance : function(target, target_radius, position, velocity,max_avoid_ahead, max_velocity, avoidance_force){
    var dynamic_length = velocity.length / max_velocity,
        ahead = position + velocity.normalize(dynamic_length * max_avoid_ahead);
        f = (ahead - target).normalize(avoidance_force);
        
    if ((target - ahead).length > target_radius)
      return new Point();
    return f;
    
    
  }

};

