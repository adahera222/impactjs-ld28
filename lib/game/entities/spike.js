ig.module(
        'game.entities.spike'
    )

    .requires(
        'game.system.eventChain',
        'game.system.stateMachine',
        'game.entities.controllers.enemyController'
    )

    .defines(function () {
        EntitySpike = EnemyController.extend({
            name: 'spike',
            collides: ig.Entity.COLLIDES.FIXED,
            type: ig.Entity.TYPE.A,
            checkAgainst: ig.Entity.TYPE.BOTH,

            animSheet: new ig.AnimationSheet('media/spike.png', 16, 9),
            size: {x: 15, y: 7},
            offset: {x: 1, y: 2},
            flip: false,

            maxVel: {x: 125, y: 300},
            friction: {x: 1000, y: 0},
            accelGround: 25,
            accelAir: 25,

            health: 20,
            damageAmount: 10,
            isDead: false,
            deathEventChain: null,
            ai: null,

            init: function (x, y, settings) {
                this.parent(x, y, settings);

                this.addAnim('idle', 1, [0]);
                this.addAnim('run', 0.1, [0, 1, 2]);

                this.currentAnim = this.anims.idle;

                this.isDead = false;
                this.accelGround = Math.random() * (10 - 25) + 25;
                this.deathEventChain = EventChain(this)
                    .then(function () {
                        this.isDead = true;
                    })
                    .repeat();
                // Simple EventChain used for roaming AI.
                var roam = EventChain(this)
                    .then(function () {
                        this.moveLeft();
                    })
                    .wait(Math.random() * (5 - 2) + 2)
                    .then(function () {
                        this.moveRight();
                    })
                    .wait(Math.random() * (5 - 2) + 2)
                    .then(function () {
                        this.stand()
                    })
                    .wait(Math.random() * (5 - 2) + 2)
                    .repeat();

                // Setup FSM.
                this.ai = new StateMachine();
                var self = this;
                // Setup state definitions.
                this.ai.state('roam', {
                    enter: function () {
                        self.currentAnim = self.anims.idle;
                    },
                    update: function () {
                        if (self.vel.x == 0) {
                            self.currentAnim = self.anims.idle;
                        } else {
                            self.currentAnim = self.anims.run;
                        }
                        roam();
                    }
                });
                this.ai.state('chase', {
                    enter: function () {
                        self.currentAnim = self.anims.run;
                    },
                    update: function () {
                        if (self.angleTo(ig.game.player) > -3) {
                            self.chaseRight();
                        } else {
                            self.chaseLeft();
                        }
                    }
                });
                // Setup transitions.
                this.ai.transition('goRoaming', 'chase', 'roam', function () {
                    return self.distanceTo(ig.game.player) > 60;
                });
                this.ai.transition('goChasing', 'roam', 'chase', function () {
                    return self.distanceTo(ig.game.player) < 50;
                });

                this.setAi(this.ai);
            },

            update: function () {
                this.currentAnim.flip.x = this.flip;
                this.parent();
            },

            ready: function () {
                this.isDead = false;
            },

            kill: function () {
                this.deathEventChain();
                this.parent();
            }
        });
    });