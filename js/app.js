const canvas = document.getElementById("gameField"),
    ctx = canvas.getContext("2d"),
    canvasWidth = 590,
    canvasHeight = 650;
//инициализация игрвого поля

//глобальные переменные
const playerPlain = {
        pos: [300, 600],
        playerSpeed: 50,
        size: [40, 20],
        playerPlainRender: function() {
            ctx.fillStyle = "red";
            ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        }
    },
    buttonPlayAgain = {
        pos: [200, 500],
        width: 180,
        height: 70,
        text: "Play again"
    },
    buttonPlayStart = {
        pos: [200, 400],
        width: 180,
        height: 70,
        text: "Start"
    };

let lastTime,
    sizeEnemy = {
        width: 30,
        height: 20
    },
    distanceBetween = {
        width: 15,
        height: 20
    },
    gameTime = 0,
    scoreNumber = 0,
    lives = 1,
    GameOver = false,
    bulletsPlayer = [],
    EnemyTable = makeEnemyTable(100, 100, 8, 5),
    bulletsEnemy = [],
    lastFirePlayer = Date.now(),
    lastFireEnemy = Date.now(),
    enemyDirection = 'Right';


//конструктор корабля противника
function Enemy(positionX, positionY, color) {
    this.pos = [positionX, positionY];
    this.speed = 120;
    this.size = [30, 20],
        this.color = color;
    this.renderEnemy = function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    }
}

//конструктор создающией двумерный массив кораблей противника, имеющий в себе методы обработки этого массива и доступ его данным
function makeEnemyTable(startPositionX, startPositionY, numberColumn, numberHeight) {

    let enemyArrayArraysShips = [],
        arrayRow = [],
        arrayColor = ["blue", "white", "green"],
        iterateStartPositionX = startPositionX;
    for (let j = 0; j < numberHeight; j++) {
        let enemyColor = (j === 0) ? arrayColor[0] : (j === 1) || (j === 2) ? arrayColor[1] : arrayColor[2];
        for (let i = 0; i < numberColumn; i++) {
            arrayRow.push(new Enemy(iterateStartPositionX, startPositionY, enemyColor));
            iterateStartPositionX += sizeEnemy.width + distanceBetween.width;
        }
        enemyArrayArraysShips.push(arrayRow);
        arrayRow = [];
        startPositionY += sizeEnemy.height + distanceBetween.height;
        iterateStartPositionX = startPositionX;
    }
    return {
        getEnemyTable: function() {
            return enemyArrayArraysShips;
        },
        deleteEnemy: function(enemyIndexRow, enemyIndexNumber) {
            enemyArrayArraysShips[enemyIndexRow].splice(enemyIndexNumber, 1)
        },
        actionForAllEnemys: function(actionFunction) {
            enemyArrayArraysShips.forEach(function(enemysRow, j, enemysArray) {
                enemysRow.forEach(function(enemy, i, enemysRow) {
                    actionFunction(enemy);
                })
            })
        },
        actionForAllIndexes: function(actionFunction) {
            enemyArrayArraysShips.forEach(function(enemysRow, j, enemysArray) {
                enemysRow.forEach(function(enemy, i, enemysRow) {
                    actionFunction(enemy, j, i);
                })
            })
        },
        minPositionXEnemy: function() {

            let minPositionX = _.first(_.first(enemyArrayArraysShips)).pos[0],
                firstEnemy = _.first(_.first(enemyArrayArraysShips));

            enemyArrayArraysShips.forEach(function(enemyRow, i, enemyArrayArraysShips) {
                if (_.first(enemyRow).pos[0] < minPositionX) {
                    minPositionX = _.first(enemyRow).pos[0];
                    firstEnemy = _.first(enemyRow);
                }
            })
            return firstEnemy;
        },
        maxPositionXEnemy: function() {
            let maxPositionX = _.last(_.last(enemyArrayArraysShips)).pos[0],
                lastEnemy = _.last(_.last(enemyArrayArraysShips));

            enemyArrayArraysShips.forEach(function(enemyRow, i, enemyArrayArraysShips) {
                if (_.last(enemyRow).pos[0] > maxPositionX) {
                    maxPositionX = _.last(enemyRow).pos[0];
                    lastEnemy = _.last(enemyRow);
                }
            })
            return lastEnemy;
        },

        enemyFireRow: function() {
            function findMaxY(posX) {
                const enemyColumnPosX = [];
                enemyArrayArraysShips.forEach(function(enemyRow, i, EnemyTable) {
                    enemyColumnPosX.push(_.find(enemyRow, function(enemy) {
                        return enemy.pos[0] === posX;
                    }))
                })
                let biggerPosYEnemy = _.first(enemyColumnPosX);

                enemyColumnPosX.forEach(function(enemy, i, enemyColumnPosX) {
                    if (typeof enemy !== "undefined") {
                        if (enemy.pos[1] > biggerPosYEnemy.pos[1]) {
                            biggerPosYEnemy = enemy;
                        }
                    }
                })
                return biggerPosYEnemy;
            }

            const enemyCanShoot = [];
            let EnemyFirstRow = _.first(enemyArrayArraysShips);
            EnemyFirstRow.forEach(function(enemy, i, EnemyFirstRow) {
                enemyCanShoot.push(findMaxY(enemy.pos[0], EnemyTable));
            });
            return enemyCanShoot;
        }
    }
}



//рисунок темного экрана и кнопки старт перед началом игры. 
function formGameStart() {
    function renderStart() {
        let rectangleFrame = {
            pos: [100, 300],
            width: 400,
            height: 200
        };

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = "white";
        ctx.strokeRect(rectangleFrame.pos[0], rectangleFrame.pos[1], rectangleFrame.width, rectangleFrame.height);
        ctx.strokeRect(buttonPlayStart.pos[0], buttonPlayStart.pos[1], buttonPlayStart.width, buttonPlayStart.height);
        ctx.fillStyle = "white";
        ctx.font = "25px Arial";
        ctx.fillText(buttonPlayStart.text, buttonPlayStart.pos[0] + 25, buttonPlayStart.pos[1] + buttonPlayStart.height / 2 + 5);
    }

    function gameStartAction() {
        function isInside(pos, rect) {
            return pos.x > rect.pos[0] && pos.x < rect.pos[0] + rect.width && pos.y < rect.pos[1] + rect.height && pos.y > rect.pos[1]
        }

        function getMousePos(canvas, event) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        canvas.addEventListener('click', function(evt) {
            var mousePos = getMousePos(canvas, evt);
            if (isInside(mousePos, buttonPlayStart)) {
                init();
            }
        }, false);
    }

    renderStart();
    gameStartAction();
}

function init() {
    lastTime = Date.now();
    main();
}

function main() {
    // выввод очков  и времени игры по окончанию игры с возможностью начать игру сначала
    function formGameOver() {

        function renderGameOver() {
            let
                rectangleFrame = {
                    pos: [100, 100],
                    width: 400,
                    height: 500
                },
                title = {
                    pos: [220, 200],
                    text: "GameOver!"
                },
                score = {
                    pos: [120, 280],
                    text: "Score= "
                },
                time = {
                    pos: [120, 350],
                    text: "Time= ",
                    timeNumber: gameTime
                }

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.strokeStyle = "white";
            ctx.strokeRect(rectangleFrame.pos[0], rectangleFrame.pos[1], rectangleFrame.width, rectangleFrame.height);
            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.fillText(title.text, title.pos[0], title.pos[1]);
            ctx.fillText(score.text + scoreNumber, score.pos[0], score.pos[1]);
            ctx.fillText(time.text + time.timeNumber.toFixed(2), time.pos[0], time.pos[1]);
            ctx.strokeRect(buttonPlayAgain.pos[0], buttonPlayAgain.pos[1], buttonPlayAgain.width, buttonPlayAgain.height);
            ctx.font = "25px Arial";
            ctx.fillText("Play again!", buttonPlayAgain.pos[0] + 25, buttonPlayAgain.pos[1] + buttonPlayAgain.height / 2 + 5);
        }

        function gameStartAction() {

            function isInside(pos, rect) {
                return pos.x > rect.pos[0] && pos.x < rect.pos[0] + rect.width && pos.y < rect.pos[1] + rect.height && pos.y > rect.pos[1]
            }

            function getMousePos(canvas, event) {
                var rect = canvas.getBoundingClientRect();
                return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
            }

            function initBaseValue() {
                gameTime = 0;
                scoreNumber = 0;
                lives = 1;
                GameOver = false;
                bulletsPlayer = [];
                bulletsEnemy = [];
                EnemyTable = makeEnemyTable(100, 100, 8, 5);
                lastFirePlayer = Date.now();
                lastFireEnemy = Date.now();
                enemyDirection = 'Right';
                playerPlain[0] = 300;
                playerPlain[1] = 600;
            }

            canvas.addEventListener('click', function(evt) {
                var mousePos = getMousePos(canvas, evt);
                if (isInside(mousePos, buttonPlayAgain)) {

                    initBaseValue();

                    GameOver = false;
                    main();
                }
            }, false);
        }


        renderGameOver();
        gameStartAction();
    }

    if (GameOver) {
        formGameOver();
    } else {
        let now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        //обновления положения элементов на игровом поле
        update(dt);
        // отрисовка элементов в их новом положении
        render();

        lastTime = now;
        window.requestAnimationFrame(main);
    }
};


function update(dt) {
    gameTime += dt;

    function handleInput(dt) {

        //Function to check whether a point is inside a rectangle

        if (input.isDown('LEFT')) {
            playerPlain.pos[0] -= playerPlain.playerSpeed * dt;
        }
        if (input.isDown('RIGHT')) {
            playerPlain.pos[0] += playerPlain.playerSpeed * dt;
        }
        if (input.isDown('SPACE') && (Date.now() - lastFirePlayer > 200)) {
            let bulletX = playerPlain.pos[0] + playerPlain.size[0] / 2,
                bulletY = playerPlain.pos[1] - playerPlain.size[1] / 2;

            bulletsPlayer.push({
                pos: [bulletX, bulletY],
                size: [10, 10],
                speed: 60,
                color: "green",
                renderBullet: function() {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
                }
            });
            lastFirePlayer = Date.now();
        }
    }

    //обновления движения противника, движения пули противника, движения пули игрока
    function updateEntities(dt) {

        let enemyMaxPositionX = EnemyTable.maxPositionXEnemy(),
            enemyMinPositionX = EnemyTable.minPositionXEnemy();


        function enemyWay(dt) {


            function enemyGoRight(dt) {
                if ((enemyMaxPositionX.pos[0] + enemyMaxPositionX.size[0]) < canvasWidth) {
                    let actionFunction = (function(dt) {
                        return function(enemy) {
                            enemy.pos[0] += enemy.speed * dt;
                        }
                    })(dt)
                    EnemyTable.actionForAllEnemys(actionFunction)
                } else {
                    enemyDirection = 'Left'
                }
            }

            function enemyGoLeft(dt) {
                if (enemyMinPositionX.pos[0] > 0) {
                    let actionFunction = (function actionFunction(dt) {
                        return function(enemy) {
                            enemy.pos[0] -= enemy.speed * dt;
                        }
                    })(dt)
                    EnemyTable.actionForAllEnemys(actionFunction)
                } else {
                    enemyDirection = 'Down'
                }
            }

            function enemyGoDown(dt) {
                let actionFunction = (function(dt) {
                    return function(enemy) {
                        enemy.pos[1] += 20 * enemy.size[0] * dt;
                        enemyDirection = 'Right';
                    }
                })(dt)
                EnemyTable.actionForAllEnemys(actionFunction)
            }

            switch (enemyDirection) {
                case 'Left':
                    enemyGoLeft(dt)
                    break;
                case 'Right':
                    enemyGoRight(dt)
                    break;

                case 'Down':
                    enemyGoDown(dt)
                    break;

                default:
                    console.log("unknown direction!");
            }

        }
        enemyWay(dt);

        function enemyFire(dt) {


            if (Date.now() - lastFireEnemy > 1000) {
                let
                    enemyCanFireRow = EnemyTable.enemyFireRow(),
                    enemyCanFireRowLength = enemyCanFireRow.length - 1,
                    enemyRandom = enemyCanFireRow[_.random(enemyCanFireRowLength)],
                    bulletX = enemyRandom.pos[0] + enemyRandom.size[0] / 2,
                    bulletY = enemyRandom.pos[1] + enemyRandom.size[1] / 2;
                bulletsEnemy.push({
                    pos: [bulletX, bulletY],
                    size: [10, 10],
                    speed: 160,
                    color: "blue",
                    renderBullet: function() {
                        ctx.fillStyle = this.color;
                        ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
                    }
                });
                lastFireEnemy = Date.now();
            }
        }
        enemyFire(dt);

        function bulletWayPlayer(dt) {
            bulletsPlayer.forEach(function(bullet, i, bulletsPlayer) {
                bullet.pos[1] -= bullet.speed * dt;
            })
        }

        function bulletWayEnemy(dt) {
            bulletsEnemy.forEach(function(bullet, i, bulletsEnemy) {
                bullet.pos[1] += bullet.speed * dt;
            })
        }

        bulletWayPlayer(dt);
        bulletWayEnemy(dt);
    }

    function checkPlayerBounds() {
        // Check bounds
        if (playerPlain.pos[0] < 0) {
            playerPlain.pos[0] = 0;
        } else if (playerPlain.pos[0] > canvasWidth - playerPlain.sizeX) {
            playerPlain.pos[0] = canvasWidth - playerPlain.sizeX;
        }

        if (playerPlain.pos[1] < 0) {
            playerPlain.pos[1] = 0;
        } else if (playerPlain.pos[1] > canvasHeight - playerPlain.sizeY) {
            playerPlain.pos[1] = canvasHeight - playerPlain.sizeY;
        }
    }

    //проверка не уничтожил ли выстрел игрока противника, 
    //если уничтожил добавить очков игроку, удалить противника и выстрел игрока  с игрового поля
    function checkCollisionsBulletEnemy() {

        function isCollision(enemy, bullet) {

            return ((enemy.pos[0] <= bullet.pos[0]) &&
                ((enemy.pos[0] + enemy.size[0]) > bullet.pos[0]) &&
                ((enemy.pos[1] + enemy.size[1]) >= bullet.pos[1]) &&
                (enemy.pos[1] < bullet.pos[1])
            )
        }

        function removeBulletAndEnemy(bulletIndex, enemyIndexRow, enemyIndexNumber) {
            bulletsPlayer.splice(bulletIndex, 1);
            EnemyTable.deleteEnemy(enemyIndexRow, enemyIndexNumber);
            EnemyTable.actionForAllEnemys(function(enemy) {
                enemy.speed += 20;
            })
        }


        bulletsPlayer.forEach(function(bullet, indexBullet, bulletArray) {
            let actionFunction = (function(indexBullet, isCollision, removeBulletAndEnemy) {
                return function(enemy, j, i) {
                    if (isCollision(enemy, bullet)) {
                        scoreNumber += 20;
                        removeBulletAndEnemy(indexBullet, j, i)
                    }
                }
            })(indexBullet, isCollision, removeBulletAndEnemy);
            EnemyTable.actionForAllIndexes(actionFunction);
        })
    }

    //проверка не попал ли выстрел противника в игрока. 
    //Если попал, то отнять жизнь у игрока и удалить выстрел противника. 
    //если у игрока не осталось жизней, то выввести форму конец игры
    function checkCollisionsBulletPlayer() {

        function isCollision(player, bullet) {

            return ((player.pos[0] <= bullet.pos[0]) &&
                ((player.pos[0] + player.size[0]) > bullet.pos[0]) &&
                ((player.pos[1] + player.size[1]) >= bullet.pos[1]) &&
                (player.pos[1] < bullet.pos[1])
            )
        }

        bulletsEnemy.forEach(function(bullet, i, bulletArray) {
            if (isCollision(playerPlain, bullet)) {
                lives -= 1;
                if (lives === 0) {
                    GameOver = true;
                }
                bulletsEnemy.splice(i, 1);
            }
        })
    }

    //Если противник врезался в игрока, то вывести форму конец игры. 
    function checkEnemyCrashPlayer() {

        function isCrash(enemy, player) {
            return ((enemy.pos[0] <= player.pos[0]) &&
                ((enemy.pos[0] + enemy.size[0]) > player.pos[0]) &&
                ((enemy.pos[1] + enemy.size[1]) >= player.pos[1]) &&
                (enemy.pos[1] < player.pos[1]))
        }
        let actionFunction = (function(playerPlain, isCrash) {
            return function(enemy) {
                if (isCrash(enemy, playerPlain)) {
                    GameOver = true;
                }
            }
        })(playerPlain, isCrash);

        EnemyTable.actionForAllEnemys(actionFunction);
    }

    handleInput(dt);
    updateEntities(dt);
    checkPlayerBounds();
    checkCollisionsBulletEnemy();
    checkCollisionsBulletPlayer();
    checkEnemyCrashPlayer();
}


function render() {

    function renderBulletArray(bulletArray) {
        bulletArray.forEach(function(bullet, i, bulletArray) {
            bullet.renderBullet();
        })
    }

    function renderScoreLives() {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Score=" + scoreNumber, 10, 50);

        // ctx.font = "30px Arial";
        ctx.fillText("Lives=" + lives, 200, 50);
    }
    //strokeRect(x, y, width, height); 
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    playerPlain.playerPlainRender();
    EnemyTable.actionForAllEnemys(function(enemy) {
        enemy.renderEnemy();
    })
    renderBulletArray(bulletsPlayer);
    renderBulletArray(bulletsEnemy);
    renderScoreLives();
};

//начало работы программы
formGameStart();