import "./styles.css";
import Phaser from "phaser";

// game configuration
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 800,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// player and cursors as global variables
let player;
let cursors;
let bullets;
let spacebar;
let lastFiredTime = 0;
let enemies;
let enemyBullets;
let nextEnemyTime = 0;
let playerLives = 5;

// game creation
new Phaser.Game(config);

// preloading assets
function preload() {
  this.load.image("ship", "images/ship.png");
  this.load.image("bullet", "images/laser.png");
  this.load.image("enemy", "images/enemy.png");
  this.load.image("enemyBullet", "images/enemy_laser.png");
  this.load.image("explosion", "images/explosion.png");
}

// setting up game scene
function create() {
  player = this.physics.add.image(config.width / 2, config.height - 50, "ship");
  cursors = this.input.keyboard.createCursorKeys();
  spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Creating a group for bullets
  bullets = this.physics.add.group({
    defaultKey: "bullet",
    maxSize: 100
  });

  // Creating a group for enemies
  enemies = this.physics.add.group();

  // Creating a group for enemy bullets
  enemyBullets = this.physics.add.group({
    defaultKey: "enemyBullet",
    maxSize: 100
  });

  // Collisions between player bullets and enemies
  this.physics.add.collider(
    bullets,
    enemies,
    (bullet, enemy) => {
      bullets.killAndHide(bullet);
      bullet.body.enable = false;
      bullet.destroy();
      enemies.killAndHide(enemy);
      enemy.body.enable = false;
    },
    null,
    this
  );

  // Collisions between enemy bullets and player
  this.physics.add.collider(
    player,
    enemyBullets,
    (player, enemyBullet) => {
      //enemyBullet.body.enable = false;
      //enemyBullet.destroy();
      enemyBullets.killAndHide(enemyBullet);
      enemyBullet.body.enable = false;
      enemyBullet.destroy();
      playerLives -= 1;
      console.log("Hit", playerLives);

      // 爆発画像を表示
      let explosion = this.physics.add.image(player.x, player.y, "explosion");
      // 300ミリ秒後に爆発画像を削除
      this.time.delayedCall(300, () => {
        explosion.destroy();
      });
    },
    null,
    this
  );
}

// game loop
function update(time, delta) {
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
  } else if (cursors.up.isDown) {
    player.setVelocityY(-160);
  } else if (cursors.down.isDown) {
    player.setVelocityY(160);
  } else {
    player.setVelocityX(0);
    player.setVelocityY(0);
  }

  // Shoot a bullet
  if (Phaser.Input.Keyboard.JustDown(spacebar) && time > lastFiredTime) {
    let bullet = bullets.get(player.x, player.y - 50);

    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setVelocityY(-900);
      lastFiredTime = time + 100; // 1 second delay between bullets
    }
  }

  // Create a new enemy
  if (time > nextEnemyTime) {
    let enemy = enemies.create(
      Phaser.Math.Between(50, config.width - 50),
      -50,
      "enemy"
    );
    enemy.setVelocityY(600);
    nextEnemyTime = time + Phaser.Math.Between(600, 1200); // 2-5 seconds delay between enemies

    // Enemy actions
    this.time.addEvent({
      delay: Phaser.Math.Between(400, 800), // 2-4 seconds delay before enemy stops
      callback: () => {
        enemy.setVelocityY(0);
        // Enemy shoots
        let ebullet = enemyBullets.get(enemy.x, enemy.y);
        if (ebullet) {
          ebullet.setActive(true);
          ebullet.setVisible(true);
          ebullet.setVelocityY(600);
        }
        // Enemy turns around after a delay
        this.time.addEvent({
          delay: 400, // 1 second delay before enemy turns around
          callback: () => {
            enemy.setVelocityY(-1200);
          }
        });
      }
    });
  }

  // recycle bullets
  bullets.children.each(function (bullet) {
    if (bullet.y < 0) {
      bullets.killAndHide(bullet);
    }
  }, this);

  // recycle enemy bullets
  enemyBullets.children.each(function (eBullet) {
    if (eBullet.y > config.height) {
      enemyBullets.killAndHide(eBullet);
    }
  }, this);
}
