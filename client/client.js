var gameScale = 1.5
var uniqueCounter = 0

var Client = IgeClass.extend({
	classId: 'Client',

	init: function () {
		//ige.addComponent(IgeEditorComponent);
		ige.addComponent(IgeAudioComponent);

		// Load our textures
		var self = this;
		this.audio = {};
		this.textures = {};
		this.fsm = new IgeFSM();

		// Define the fsm states
		this.fsm.defineState('select', {
            enter: function(data, completeCallback) {
				// Hook mouse events
				completeCallback();
			},
            exit: function(data, completeCallback) {
				// Un-hook mouse events
				completeCallback();
			}
        });

		this.fsm.defineState('buildDialog', {
            enter: function(data, completeCallback) {
				completeCallback();
			},
            exit: function(data, completeCallback) {
				completeCallback();
			}
        });

        var clientSelf = this

		this.fsm.defineState('build', {
            enter: function(data, completeCallback) {
				var self = this,
					tileMap = ige.$('tileMap1');

				// Create a new instance of the object we are going to build
				ige.client.cursorObject = new ige.newClassInstance(data.classId)
					.mount(ige.$('tileMap1'))
                    .layer(24);
                var cursorClassId = data.classId

				ige.client.cursorObjectData = data;

				var objectTileWidth = Math.ceil(ige.client.cursorObject._bounds3d.x
                                                / tileMap._tileWidth);
				var objectTileHeight = Math.ceil(ige.client.cursorObject._bounds3d.y
                                             / tileMap._tileHeight);

                var HiEntity = IgeEntity.extend({
			         classId: 'HiEntity' + (uniqueCounter ++),
			         tick: function (ctx) {
				         IgeEntity.prototype.tick.call(this, ctx);
                         for(var x_=-100; x_ < 300; x_ ++) {
                             for(var y_=-100; y_ < 300; y_ ++) {
                                 var x = x_ * 20;
                                 var y = y_ * 20;
                                 var tx = Math.ceil(x / tileMap._tileWidth);
                                 var ty = Math.ceil(y / tileMap._tileHeight);
                                 if(!tileMap.inGrid(tx, ty, 1, 1)) continue;

                                 var isFree = !tileMap.isTileOccupied(
						             tx,
						             ty,
						             objectTileWidth,
						             objectTileHeight);

                                 if(isFree)
				                     ctx.fillStyle = '#3f3';
                                 else
                                     ctx.fillStyle = 'red';

                                 var point = new IgePoint3d(x, y, 0);
                                 var p = point.toIso();
                                 ctx.fillRect(p.x, p.y, 3, 3);
                             }
                         }
			         }
		         });

                var hientity = new HiEntity()
                    .layer(20)
                    .translateTo(0, 0, 0)
                    .mount(tileMap);

				// Hook mouse events
				self.mouseMoveHandle = tileMap.on('mouseMove', function (event, evc, data) {
					var tile = tileMap.mouseToTile();

					// Check that the tiles this object will occupy if moved are
					// not already occupied
					if (tileMap.inGrid(tile.x, tile.y, objectTileWidth, objectTileHeight)) {
                        var isFree = !tileMap.isTileOccupied(
						    tile.x,
						    tile.y,
						    objectTileWidth,
						    objectTileHeight);
                        ige.client.cursorObject.opacity(isFree ? 1 : 0.5);
						// Move our cursor object to the tile
                        var tx = tile.x + ige.client.cursorObject._tileAdjustX;
                        var ty = tile.y + ige.client.cursorObject._tileAdjustY;
						ige.client.cursorObject.translateToTile(tx, ty);
						self.cursorTile = tile;
					}
				});

				self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {

                    hientity.unMount();

                    var tile = tileMap.mouseToTile();
                    if(tileMap.isTileOccupied(
						    tile.x,
						    tile.y,
						    objectTileWidth,
						    objectTileHeight)) {

                        ige.client.cursorObject.destroy();
                        ige.client.cursorObject = null;
					    ige.client.cursorObjectData = null;

                        clientSelf.fsm.enterState('select')

                        return;
                    }

                    // Reduce the coins progress bar by the cost
                    if(!API.reduceAssets(
                        {coins: parseInt(ige.client.cursorObjectData.coins, 10),
                        cash: parseInt(ige.client.cursorObjectData.cash, 10)})) {
                        // Not enough money?
                        ige.client.cursorObject.destroy();
                        ige.client.cursorObject = null;
					    ige.client.cursorObjectData = null;

                        ige.$('coinDialog').show();
                        clientSelf.fsm.enterState('select')
                        return;
                    }

					var objectTileWidth = Math.ceil(ige.client.cursorObject._bounds3d.x
                                                    / tileMap._tileWidth),
						objectTileHeight = Math.ceil(ige.client.cursorObject._bounds3d.y
                                                     / tileMap._tileHeight),
						player = ige.$('bob'),
						playerTile = player.currentTile();

					// Play the audio
					ige.client.audio.monster_footstep.play();

					// Build the cursorObject by releasing it from our control
					// and switching state
					ige.client.cursorObject.occupyTile(
						self.cursorTile.x,
						self.cursorTile.y,
						objectTileWidth,
						objectTileHeight
					);

                    var objinfo = {
                        x: self.cursorTile.x,
						y: self.cursorTile.y,
						w: objectTileWidth,
						h: objectTileHeight,
                        name: cursorClassId,
                    }

                    API.createObject(objinfo)

					// Grab the point the entity is at before we animate it
					var buildPoint = ige.client.cursorObject._translate.toIso();

					// Tween the object to the position by "bouncing" it
					ige.client.cursorObject
                        .layer(5)
						.translate().z(100)
						._translate.tween(
							{z: 0},
							1000,
							{easing:'outBounce'}
						).start();

					// Set initial state of object by calling the place() method
					ige.client.cursorObject.place();

					// Create a cash value rising from placement that fades out
					var coinAnim;

					coinAnim = new IgeEntity()
						.layer(10)
						.texture(ige.client.textures.coin)
						.dimensionsFromCell()
						.scaleTo(1, 1, 1)
						.translateToPoint(buildPoint)
						.translateBy(-10, -50, 0)
						.mount(ige.$('tileMap1'));

					new IgeFontEntity()
						.layer(2)
						.textAlignX(0)
						.colorOverlay('#ffffff')
						.nativeFont('12px Verdana')
						.textLineSpacing(0)
						.text('-' + ige.client.cursorObjectData.coins)
						.width(24)
						.center(20)
						.mount(coinAnim);

					coinAnim
						._translate.tween(
							{y: buildPoint.y - 100},
							2000
						)
						.start(200);

					coinAnim.tween(
							{_opacity: 0},
							2000,
							{easing: 'inQuad'}
						)
						.afterTween(function () {
							coinAnim.destroy();
						})
						.start(200);

					// Play the coin particle effect
					ige.$('coinEmitter')
						.quantityMax(parseInt(ige.client.cursorObjectData.coins, 10))
						.start();

					// Remove reference to the object
					ige.client.cursorObject = null;
					ige.client.cursorObjectData = null;

					// Enter the select state
					ige.client.fsm.enterState('select');

					// Check if the tile we are standing on is occupied now
					if (ige.$('tileMap1').isTileOccupied(playerTile.x, playerTile.y, 1, 1)) {
						// Move our player away from the tile
						ige.$('bob').walkToTile(playerTile.x + 1, playerTile.y - 1);
					} else {
						// Move the player to the building
						ige.$('bob').walkToTile(self.cursorTile.x, self.cursorTile.y);
					}
				});

				completeCallback();
			},
            exit: function(data, completeCallback) {
				// Clear our mouse listeners
				var self = this,
					tileMap = ige.$('tileMap1');

				tileMap.off('mouseUp', self.mouseUpHandle);
				tileMap.off('mouseMove', self.mouseMoveHandle);

				completeCallback();
			}
        });

		this.fsm.defineState('pan', {
            enter: function(data, completeCallback) {
				completeCallback();
			},
            exit: function(data, completeCallback) {
				completeCallback();
			}
        });

		this.fsm.defineTransition('build', 'buildDialog', function (data, callback) {
			// Ensure that the item we were building is removed because
			// it was not placed
			if (ige.client.cursorObject) {
				ige.client.cursorObject.destroy();
				delete ige.client.cursorObject;
			}

			// Callback with no error
			callback(false);
		});

		// Load game audio
		this.audio.select = new IgeAudio('./assets/audio/select.mp3');
        this.audio.normClick = new IgeAudio('./assets/audio/generalclick04.wav');
		//this.audio.construct = new IgeAudio('./assets/audio/construct.mp3');
        this.audio.monster_footstep = new IgeAudio('./assets/audio/creatur_footstep_large.mp3');
		this.audio.dialogOpen = new IgeAudio('./assets/audio/dialogOpen.mp3');

		// Load a game texture here
		this.textures.greenBackground = new IgeTexture('./assets/textures/backgrounds/greenBackground.png');
        this.textures.valleyBackground = new IgeTexture('./assets/textures/backgrounds/valleyBackground.png')
		this.textures.dirtBackground = new IgeTexture('./assets/textures/backgrounds/dirtBackground.png');

		this.textures.moneyMenuBackground = new IgeTexture('./assets/textures/ui/CashMenuTemplate.png');
        this.textures.mainMenuBackground = new IgeTexture('./assets/textures/ui/mainMenuBackground.png');
		this.textures.marketItemBack = new IgeTexture('./assets/textures/ui/marketItemBack.png');
		this.textures.buildButton = new IgeTexture('./assets/textures/ui/build.png');
        this.textures.greenPlus = new IgeTexture('./assets/textures/ui/green+.png');
		this.textures.giftButton = new IgeTexture('./assets/textures/ui/giftButton.png');
		this.textures.actionButtonBack = new IgeTexture('./assets/textures/ui/actionButtonBack.png');
		this.textures.actionIconSelect = new IgeTexture('./assets/textures/ui/actionIconSelect.png');
		this.textures.friendTile = new IgeTexture('./assets/textures/ui/friendTile.png');
		this.textures.marketMenuBack = new IgeTexture('./assets/textures/ui/marketMenuBack.png');
		this.textures.cashBar = new IgeTexture('./assets/textures/ui/cashBar.png');
		this.textures.coinsBar = new IgeTexture('./assets/textures/ui/coinsBar.png');
		this.textures.energyBar = new IgeTexture('./assets/textures/ui/energyBar.png');
		this.textures.xpBar = new IgeTexture('./assets/textures/ui/xpBar.png');
		this.textures.coin = new IgeTexture('./assets/textures/ui/coin.png');
		this.textures.cash = new IgeTexture('./assets/textures/ui/cash.png');
        this.textures.star = new IgeTexture('./assets/textures/ui/star.png');

		this.textures.leftButton1 = new IgeTexture('./assets/textures/ui/leftButton1.png');
		this.textures.leftButton2 = new IgeTexture('./assets/textures/ui/leftButton2.png');
		this.textures.leftButton3 = new IgeTexture('./assets/textures/ui/leftButton3.png');

		this.textures.rightButton1 = new IgeTexture('./assets/textures/ui/rightButton1.png');
		this.textures.rightButton2 = new IgeTexture('./assets/textures/ui/rightButton2.png');
		this.textures.rightButton3 = new IgeTexture('./assets/textures/ui/rightButton3.png');

        for(var key in GameObjects.gameObjectTextures) {
            var tex = GameObjects.gameObjectTextures[key]
            this.textures[key] = new IgeCellSheet(tex[0], tex[1], 1)
        }

		this.textures.villager1 = new IgeCellSheet('./assets/textures/sprites/villager.png', 3, 2);
		this.textures.flowerPot1 = new IgeTexture('./assets/textures/sprites/flowerPot1.png');
		this.textures.fenceSW = new IgeTexture('./assets/textures/sprites/fenceSW.png');
		this.textures.clothingLine = new IgeTexture('./assets/textures/sprites/clothingLine.png');
		this.textures.wallSE = new IgeTexture('./assets/textures/sprites/wallSE.png');

		this.textures.greenDot = new IgeTexture('./assets/textures/greendot.png');
		this.textures.redDot = new IgeTexture('./assets/textures/reddot.png');

		ige.ui.style('.dialog', {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0
		});

        ige.ui.style('#topNav', {
            'top': 10,
            'left': 10,
            'right': 10,
            'width': 1000,
            'height': 50
        });

		ige.ui.style('.underlay', {
			backgroundColor: '#000000',
			opacity: 0.6,
			left: 0,
			right: 0,
			top: 0,
			bottom: 0
		});

		// Wait for our textures to load before continuing
		ige.on('texturesLoaded', function () {
			// Create the HTML canvas
            if(true) {
			    ige.createFrontBuffer(true);
            } else {
                var canvas = $('<canvas id=gameCanvas>').appendTo('body')
                var width = 971 * gameScale
                var height = 470 * gameScale
                canvas.attr('width', width)
                canvas.attr('height', height)
                var baseSize = Math.min($(window).width() / width, $(window).height() / height)
                canvas.width(width * baseSize)
                canvas.height(height * baseSize)
                canvas.css({
                    position: 'absolute',
                    left: ($(window).width() - width * baseSize) / 2,
                    top: ($(window).height() - height * baseSize) / 2
                })
                $('body').css('background-color', '#407c03')
            }

            ige.canvas(document.getElementById('gameCanvas'));

			// Start the engine
			ige.start(function (success) {
				// Check if the engine started successfully
				function postinit() {
					// Add base scene data
					ige.addGraph('IgeBaseScene');

					// Add level1 graph
					ige.addGraph('GraphLevel1');

					// Add ui graph
					ige.addGraph('GraphUi');

					// Mouse pan with limits
					//ige.$('vp1')
					//	.addComponent(IgeMousePanComponent)
					//	.mousePan.enabled(true)
					//	.mousePan.limit(new IgeRect(-250, -200, 500, 400))

                   // if(location.search == '?bounds')
                   //     ige.$('vp1').drawBounds(true);
                    ige.$('vp1')
                        .addComponent(IgeMousePanComponent)
						.addComponent(ScrollZoomComponent)
						.addComponent(ScaleToPointComponent)
						.addComponent(PinchZoomComponent)
						.addComponent(LimitZoomPanComponent, {
							boundsX: 0,
							boundsY: 0,
							boundsWidth: 2627,
							boundsHeight: 1545
						})

						.mousePan.enabled(true)
						.scrollZoom.enabled(true)
						.autoSize(true)
                        .drawBounds(false) // Switch this to true to draw all bounding boxes
			            .drawBoundsData(false) // Switch this to true to draw all bounding boxes
						.scene(ige.$('baseScene'))
						.mount(ige);




					new Villager()
						.id('bob')
						.mount(ige.$('tileMap1'))

					// Set the initial fsm state
					self.fsm.initialState('select');
				}
                if (success) {
                    API.init(postinit);
                }
			});
		});
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }
