// Quake 3 Arena Movement Physics (pmove)
// Implements true Quake 3 ground acceleration, friction, and strafe-jumping mechanics

class QuakePhysics {
    constructor() {
        // Quake 3 physics constants (scaled for Three.js units)
        this.gravity = 25.0;
        this.friction = 6.0;
        this.groundSpeed = 10.5;
        this.airSpeed = 3.2;
        this.groundAccel = 12.0;
        this.airAccel = 2.5;
        this.jumpSpeed = 8.5;
        this.stepHeight = 0.5;

        // Player AABB dimensions
        this.playerRadius = 0.5;
        this.playerHeight = 1.8;
    }

    // Process a single physics tick for an entity (player or bot)
    updateEntity(entity, input, worldColliders, dt) {
        if (!entity.alive) return;

        // Determine ground status
        entity.onGround = this.checkGround(entity, worldColliders);

        // Movement input vector
        const wishDir = new THREE.Vector3();
        if (input.forward) wishDir.z -= 1;
        if (input.backward) wishDir.z += 1;
        if (input.left) wishDir.x -= 1;
        if (input.right) wishDir.x += 1;

        // Rotate wishDir according to entity's yaw
        if (wishDir.lengthSq() > 0) {
            wishDir.normalize();
            wishDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), entity.yaw);
        }

        // Apply Jump
        if (input.jump && entity.onGround) {
            entity.velocity.y = this.jumpSpeed;
            entity.onGround = false;
            if (entity.isPlayer) {
                window.quakeAudio.playJump();
            }
        }

        if (entity.onGround) {
            this.groundMove(entity, wishDir, dt);
        } else {
            this.airMove(entity, wishDir, dt);
            // Apply Gravity
            entity.velocity.y -= this.gravity * dt;
        }

        // Move entity with collision detection against world geometry
        this.moveWithCollisions(entity, worldColliders, dt);

        // Check for falling into void
        if (entity.position.y < -35) {
            entity.takeDamage(999, 'the void', 0);
        }
    }

    // Quake Ground Movement with Friction
    groundMove(entity, wishDir, dt) {
        // Apply friction
        const speed = Math.sqrt(entity.velocity.x * entity.velocity.x + entity.velocity.z * entity.velocity.z);
        if (speed > 0.001) {
            const drop = speed * this.friction * dt;
            const newSpeed = Math.max(0, speed - drop);
            entity.velocity.x = (entity.velocity.x / speed) * newSpeed;
            entity.velocity.z = (entity.velocity.z / speed) * newSpeed;
        }

        // Accelerate
        this.accelerate(entity, wishDir, this.groundSpeed, this.groundAccel, dt);
    }

    // Quake Air Movement (Strafe-Jumping!)
    airMove(entity, wishDir, dt) {
        // In Quake, wishspeed in air is lower, but currentspeed projection allows infinite acceleration
        this.accelerate(entity, wishDir, this.airSpeed, this.airAccel, dt);
    }

    // Classic Quake Acceleration Formula
    accelerate(entity, wishDir, wishSpeed, accel, dt) {
        const currentSpeed = entity.velocity.x * wishDir.x + entity.velocity.z * wishDir.z;
        const addSpeed = wishSpeed - currentSpeed;
        if (addSpeed <= 0) return;

        let accelSpeed = accel * wishSpeed * dt;
        if (accelSpeed > addSpeed) {
            accelSpeed = addSpeed;
        }

        entity.velocity.x += accelSpeed * wishDir.x;
        entity.velocity.z += accelSpeed * wishDir.z;
    }

    // Ground check via downward raycast / box scan
    checkGround(entity, colliders) {
        if (entity.velocity.y > 0.1) return false;

        const feetY = entity.position.y;
        const r = this.playerRadius * 0.7;

        for (const col of colliders) {
            if (col.isTrigger) continue;
            // Check if horizontal overlap
            if (entity.position.x + r > col.min.x && entity.position.x - r < col.max.x &&
                entity.position.z + r > col.min.z && entity.position.z - r < col.max.z) {
                // Check if feet are slightly above or on the top surface
                if (feetY >= col.max.y - 0.25 && feetY <= col.max.y + 0.15) {
                    entity.position.y = col.max.y;
                    entity.velocity.y = 0;
                    return true;
                }
            }
        }
        return false;
    }

    // Collision Detection & Resolution with Stepping
    moveWithCollisions(entity, colliders, dt) {
        const moveStep = entity.velocity.clone().multiplyScalar(dt);
        const r = this.playerRadius;
        const h = this.playerHeight;

        // Move X
        entity.position.x += moveStep.x;
        for (const col of colliders) {
            if (col.isTrigger) continue;
            if (this.intersects(entity.position, r, h, col)) {
                // Check step up
                const stepDiff = col.max.y - entity.position.y;
                if (entity.onGround && stepDiff > 0 && stepDiff <= this.stepHeight) {
                    entity.position.y = col.max.y;
                } else {
                    if (moveStep.x > 0) entity.position.x = col.min.x - r;
                    else if (moveStep.x < 0) entity.position.x = col.max.x + r;
                    entity.velocity.x = 0;
                }
            }
        }

        // Move Z
        entity.position.z += moveStep.z;
        for (const col of colliders) {
            if (col.isTrigger) continue;
            if (this.intersects(entity.position, r, h, col)) {
                const stepDiff = col.max.y - entity.position.y;
                if (entity.onGround && stepDiff > 0 && stepDiff <= this.stepHeight) {
                    entity.position.y = col.max.y;
                } else {
                    if (moveStep.z > 0) entity.position.z = col.min.z - r;
                    else if (moveStep.z < 0) entity.position.z = col.max.z + r;
                    entity.velocity.z = 0;
                }
            }
        }

        // Move Y
        entity.position.y += moveStep.y;
        for (const col of colliders) {
            if (col.isTrigger) continue;
            if (this.intersects(entity.position, r, h, col)) {
                if (moveStep.y > 0) { // Hit ceiling
                    entity.position.y = col.min.y - h;
                    entity.velocity.y = 0;
                } else if (moveStep.y < 0) { // Land on floor
                    entity.position.y = col.max.y;
                    entity.velocity.y = 0;
                    entity.onGround = true;
                }
            }
        }
    }

    intersects(pos, r, h, box) {
        return (pos.x + r > box.min.x && pos.x - r < box.max.x &&
                pos.y + h > box.min.y && pos.y < box.max.y &&
                pos.z + r > box.min.z && pos.z - r < box.max.z);
    }
}

window.quakePhysics = new QuakePhysics();
